import { NextRequest, NextResponse } from "next/server";
import { razorpayService } from "@/lib/razorpay";
import { db, promptPurchases, creditPurchases, userSubscriptions, promptUsage, prompts, userEarnings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const isValidSignature = razorpayService.verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log("Razorpay webhook event:", event.type);

    switch (event.type) {
      case "payment.authorized":
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
      
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case "order.paid":
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePaymentAuthorized(payment: any) {
  console.log("Payment authorized:", payment.id);
  // Payment is authorized but not yet captured
  // You can show a pending status to the user
}

async function handlePaymentCaptured(payment: any) {
  console.log("Payment captured:", payment.id);
  
  try {
    // Find the purchase record
    const [purchase] = await db
      .select()
      .from(promptPurchases)
      .where(eq(promptPurchases.razorpayPaymentId, payment.id))
      .limit(1);

    if (purchase && purchase.status === "pending") {
      // Update purchase status
      await db
        .update(promptPurchases)
        .set({
          status: "completed",
        })
        .where(eq(promptPurchases.id, purchase.id));

      // Update prompt sales and earnings
      const [prompt] = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, purchase.promptId))
        .limit(1);

      if (prompt) {
        await db
          .update(prompts)
          .set({
            totalSales: (prompt.totalSales || 0) + 1,
            totalEarnings: (Number(prompt.totalEarnings || 0) + Number(purchase.sellerEarnings)).toString(),
          })
          .where(eq(prompts.id, prompt.id));
      }

      // Update seller earnings
      await updateSellerEarnings(purchase.sellerId, purchase.sellerEarnings);
    }

    // Check for credit purchases
    const [creditPurchase] = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.razorpayPaymentId, payment.id))
      .limit(1);

    if (creditPurchase && creditPurchase.status === "pending") {
      // Update credit purchase status
      await db
        .update(creditPurchases)
        .set({
          status: "completed",
        })
        .where(eq(creditPurchases.id, creditPurchase.id));

      // Add credits to user
      await addCreditsToUser(creditPurchase.userId, creditPurchase.creditsPurchased);
    }

  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payment: any) {
  console.log("Payment failed:", payment.id);
  
  try {
    // Find and update failed purchases
    await db
      .update(promptPurchases)
      .set({
        status: "failed",
      })
      .where(eq(promptPurchases.razorpayPaymentId, payment.id));

    await db
      .update(creditPurchases)
      .set({
        status: "failed",
      })
      .where(eq(creditPurchases.razorpayPaymentId, payment.id));

  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleOrderPaid(order: any) {
  console.log("Order paid:", order.id);
  // Additional order-level processing if needed
}

async function updateSellerEarnings(sellerId: string, earnings: string) {
  try {
    const [userEarning] = await db
      .select()
      .from(userEarnings)
      .where(eq(userEarnings.userId, sellerId))
      .limit(1);

    if (userEarning) {
      await db
        .update(userEarnings)
        .set({
          totalEarnings: (Number(userEarning.totalEarnings || 0) + Number(earnings)).toString(),
          totalSales: (userEarning.totalSales || 0) + 1,
          pendingAmount: (Number(userEarning.pendingAmount || 0) + Number(earnings)).toString(),
        })
        .where(eq(userEarnings.userId, sellerId));
    } else {
      await db
        .insert(userEarnings)
        .values({
          userId: sellerId,
          totalEarnings: earnings,
          totalSales: 1,
          pendingAmount: earnings,
        });
    }
  } catch (error) {
    console.error("Error updating seller earnings:", error);
  }
}

async function addCreditsToUser(userId: string, credits: number) {
  try {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    if (subscription) {
      await db
        .update(userSubscriptions)
        .set({
          marketplaceCredits: (subscription.marketplaceCredits || 0) + credits,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, userId));
    } else {
      await db
        .insert(userSubscriptions)
        .values({
          userId: userId,
          marketplaceCredits: 5 + credits, // 5 free + purchased credits
          marketplaceCreditsUsed: 0,
          customPromptsUsed: 0,
        });
    }
  } catch (error) {
    console.error("Error adding credits to user:", error);
  }
}