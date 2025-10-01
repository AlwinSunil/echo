import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { geminiImageGenerator } from "@/lib/gemini";
import { db, images, prompts, promptUsage, userSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, count = 1, promptId } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
    }

    // Check if using marketplace prompt and validate credits
    let marketplacePrompt = null;
    if (promptId) {
      const [promptData] = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (promptData && promptData.isForSale && promptData.price && Number(promptData.price) > 0) {
        marketplacePrompt = promptData;
        
        // Check user credits
        const [subscription] = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, session.user?.id!))
          .limit(1);

        const remainingCredits = (subscription?.marketplaceCredits || 5) - (subscription?.marketplaceCreditsUsed || 0);
        
        if (remainingCredits <= 0) {
          return NextResponse.json({ 
            error: "Insufficient marketplace credits. Please purchase more credits." 
          }, { status: 402 });
        }
      }
    }

    // Generate images using Gemini
    const generatedImages = await geminiImageGenerator.generateImage({
      prompt,
      count: Math.min(count, 4), // Limit to 4 images per request
    });

    // Save images to database and track usage
    const savedImages = await Promise.all(
      generatedImages.map(async (imageData) => {
        const [savedImage] = await db
          .insert(images)
          .values({
            userId: session.user?.id!,
            promptId: promptId || null,
            imageUrl: imageData.imageData,
            isPublic: false, // Private by default
            likes: 0,
            views: 0,
          })
          .returning();

        // Track prompt usage for earnings
        if (marketplacePrompt) {
          await db.insert(promptUsage).values({
            userId: session.user?.id!,
            promptId: marketplacePrompt.id,
            imageId: savedImage.id,
            isMarketplacePrompt: true,
            creatorEarnings: "6.00", // ₹6 to creator
            platformEarnings: "4.00", // ₹4 to platform
          });

          // Update user credits
          const [subscription] = await db
            .select()
            .from(userSubscriptions)
            .where(eq(userSubscriptions.userId, session.user?.id!))
            .limit(1);

          if (subscription) {
            await db
              .update(userSubscriptions)
              .set({
                marketplaceCreditsUsed: (subscription.marketplaceCreditsUsed || 0) + 1,
                updatedAt: new Date(),
              })
              .where(eq(userSubscriptions.userId, session.user?.id!));
          } else {
            await db
              .insert(userSubscriptions)
              .values({
                userId: session.user?.id!,
                marketplaceCredits: 5,
                marketplaceCreditsUsed: 1,
                customPromptsUsed: 0,
              });
          }
        } else {
          // Track custom prompt usage
          await db.insert(promptUsage).values({
            userId: session.user?.id!,
            promptId: null,
            imageId: savedImage.id,
            isMarketplacePrompt: false,
            creatorEarnings: "0.00",
            platformEarnings: "0.00",
          });
        }

        return savedImage;
      })
    );

    return NextResponse.json({
      success: true,
      images: savedImages,
      prompt: prompt,
    });

  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}