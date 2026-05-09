import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSig !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: {
    event: string;
    payload: {
      payment: {
        entity: {
          id: string;
          order_id: string;
          email: string;
          status: string;
          notes: Record<string, string>;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = payload.payload.payment.entity;
  if (payment.status !== "captured") {
    return NextResponse.json({ received: true });
  }

  const email = payment.email;
  const creditsToAdd = parseInt(payment.notes?.credits ?? "5", 10);
  const paymentId = payment.id;

  // Idempotency: check if already processed
  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("payment_id", paymentId)
    .single();

  if (existingTx) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Upsert user and increment credits
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ email }, { onConflict: "email" })
    .select("id, credits")
    .single();

  if (userError || !user) {
    console.error("[webhook] user upsert failed:", userError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { error: creditError } = await supabase
    .from("users")
    .update({ credits: (user.credits ?? 0) + creditsToAdd })
    .eq("id", user.id);

  if (creditError) {
    console.error("[webhook] credit update failed:", creditError);
    return NextResponse.json({ error: "Credit update failed" }, { status: 500 });
  }

  // Record transaction for idempotency
  await supabase.from("transactions").insert({
    payment_id: paymentId,
    user_id: user.id,
    amount: 4900,
    credits: creditsToAdd,
    order_id: payment.order_id,
  });

  return NextResponse.json({ received: true, credits_added: creditsToAdd });
}
