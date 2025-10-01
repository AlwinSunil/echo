import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { razorpayService } from "@/lib/razorpay";
import { db, prompts, promptPurchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { promptId } = await request.json();

    if (!promptId) {
      return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
    }

    // Get prompt details
    const [prompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, promptId))
      .limit(1);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (!prompt.isForSale) {
      return NextResponse.json({ error: "Prompt is not for sale" }, { status: 400 });
    }

    if (prompt.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot buy your own prompt" }, { status: 400 });
    }

    // Check if user already purchased this prompt
    const existingPurchase = await db
      .select()
      .from(promptPurchases)
      .where(
        and(
          eq(promptPurchases.buyerId, session.user?.id!),
          eq(promptPurchases.promptId, promptId)
        )
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json({ error: "You already own this prompt" }, { status: 400 });
    }

    const amountInPaise = razorpayService.rupeesToPaise(Number(prompt.price));
    const { platformFee, sellerEarnings } = razorpayService.calculateEarnings(amountInPaise);

    // Create Razorpay order
    const order = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: `echo_prompt_${promptId}_${Date.now()}`,
      notes: {
        promptId,
        buyerId: session.user.id,
        sellerId: prompt.userId,
        promptTitle: prompt.title,
      },
    });

    // Create purchase record
    const [purchase] = await db
      .insert(promptPurchases)
      .values({
        buyerId: session.user?.id!,
        sellerId: prompt.userId,
        promptId: prompt.id,
        amount: prompt.price?.toString() || "0",
        platformFee: (platformFee / 100).toString(),
        sellerEarnings: (sellerEarnings / 100).toString(),
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
    });

  } catch (error) {
    console.error("Payment order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}