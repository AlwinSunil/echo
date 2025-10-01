import { NextRequest, NextResponse } from "next/server";
import { razorpayService } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const { amount, description, customer_id } = await request.json();

    if (!amount || typeof amount !== "number") {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const qrData = await razorpayService.generateQRCode({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      description: description || "Echo Payment",
      customer_id: customer_id,
    });

    return NextResponse.json(qrData);

  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}