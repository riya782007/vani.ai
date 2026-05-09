import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST() {
  try {
    const order = await razorpay.orders.create({
      amount: 4900, // ₹49 in paise
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
