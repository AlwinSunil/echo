import { NextRequest, NextResponse } from "next/server";
import { razorpayService } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const { vpa } = await request.json();

    if (!vpa || typeof vpa !== "string") {
      return NextResponse.json({ error: "VPA is required" }, { status: 400 });
    }

    // Basic VPA format validation
    if (!vpa.includes("@") || vpa.length < 5) {
      return NextResponse.json({ valid: false, error: "Invalid VPA format" }, { status: 400 });
    }

    // Validate VPA with Razorpay
    const validation = await razorpayService.validateVPA(vpa);

    return NextResponse.json(validation);

  } catch (error) {
    console.error("VPA validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}