import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { razorpayService } from "@/lib/razorpay";
import { db, creditPurchases, userSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creditsCount = 5 } = await request.json(); // Default to 5 credits for ₹50

    if (creditsCount !== 5) {
      return NextResponse.json({ error: "Only 5 credits package is available" }, { status: 400 });
    }

    const amountInPaise = 5000; // ₹50 in paise

    // Create Razorpay order
    const order = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: `echo_credits_${creditsCount}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        creditsCount: creditsCount.toString(),
        type: "credits",
      },
    });

    // Create credit purchase record
    const [purchase] = await db
      .insert(creditPurchases)
      .values({
        userId: session.user.id,
        creditsPurchased: creditsCount,
        amount: "50.00", // ₹50
        razorpayOrderId: order.id,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      purchaseId: purchase.id,
      credits: creditsCount,
    });

  } catch (error) {
    console.error("Credit purchase order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create credit purchase order" },
      { status: 500 }
    );
  }
}