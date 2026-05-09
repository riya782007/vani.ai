import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

// Lazy init — env vars not available at build-time static analysis
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function POST() {
  try {
    const order = await getRazorpay().orders.create({
      amount: 4900,
      currency: "INR",
      receipt: `vani_${Date.now()}`,
      notes: {
        product: "vani_credits_5",
        credits: "5",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("[razorpay] order creation failed:", err);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
