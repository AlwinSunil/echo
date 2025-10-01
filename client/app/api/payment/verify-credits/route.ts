import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { razorpayService } from "@/lib/razorpay";
import { db, creditPurchases, userSubscriptions } from "@/db/schema";
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

    // Get credit purchase record
    const [purchase] = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      return NextResponse.json({ error: "Credit purchase record not found" }, { status: 404 });
    }

    if (purchase.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update credit purchase record
    await db
      .update(creditPurchases)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        status: "completed",
      })
      .where(eq(creditPurchases.id, purchaseId));

    // Update user subscription with new credits
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user?.id!))
      .limit(1);

    if (subscription) {
      await db
        .update(userSubscriptions)
        .set({
          marketplaceCredits: (subscription.marketplaceCredits || 0) + purchase.creditsPurchased,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, session.user?.id!));
    } else {
      // Create new subscription record
      await db
        .insert(userSubscriptions)
        .values({
          userId: session.user?.id!,
          marketplaceCredits: 5 + purchase.creditsPurchased, // 5 free + purchased credits
          marketplaceCreditsUsed: 0,
          customPromptsUsed: 0,
        });
    }

    return NextResponse.json({
      success: true,
      message: "Credits purchased successfully",
      purchaseId: purchase.id,
      creditsAdded: purchase.creditsPurchased,
    });

  } catch (error) {
    console.error("Credit purchase verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify credit purchase" },
      { status: 500 }
    );
  }
}