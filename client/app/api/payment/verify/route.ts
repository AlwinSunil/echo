import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { razorpayService } from "@/lib/razorpay";
import { db, promptPurchases, prompts, userEarnings } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      purchaseId 
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseId) {
      return NextResponse.json({ error: "Missing required payment data" }, { status: 400 });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Verify payment with Razorpay
    const isPaymentValid = await razorpayService.verifyPayment(
      razorpay_payment_id,
      razorpay_order_id
    );

    if (!isPaymentValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Get purchase record
    const [purchase] = await db
      .select()
      .from(promptPurchases)
      .where(eq(promptPurchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      return NextResponse.json({ error: "Purchase record not found" }, { status: 404 });
    }

    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update purchase record
    await db
      .update(promptPurchases)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        status: "completed",
      })
      .where(eq(promptPurchases.id, purchaseId));

    // Update prompt sales count
    await db
      .update(prompts)
      .set({
        totalSales: purchase.totalSales + 1,
        totalEarnings: Number(purchase.totalEarnings) + Number(purchase.sellerEarnings),
      })
      .where(eq(prompts.id, purchase.promptId));

    // Update seller earnings
    const [sellerEarnings] = await db
      .select()
      .from(userEarnings)
      .where(eq(userEarnings.userId, purchase.sellerId))
      .limit(1);

    if (sellerEarnings) {
      await db
        .update(userEarnings)
        .set({
          totalEarnings: Number(sellerEarnings.totalEarnings) + Number(purchase.sellerEarnings),
          totalSales: sellerEarnings.totalSales + 1,
          pendingAmount: Number(sellerEarnings.pendingAmount) + Number(purchase.sellerEarnings),
        })
        .where(eq(userEarnings.userId, purchase.sellerId));
    } else {
      await db
        .insert(userEarnings)
        .values({
          userId: purchase.sellerId,
          totalEarnings: purchase.sellerEarnings,
          totalSales: 1,
          pendingAmount: purchase.sellerEarnings,
        });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      purchaseId: purchase.id,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}