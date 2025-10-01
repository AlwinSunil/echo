import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { geminiImageGenerator } from "@/lib/gemini";
import { db, images } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, count = 1 } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
    }

    // Generate images using Gemini
    const generatedImages = await geminiImageGenerator.generateImage({
      prompt,
      count: Math.min(count, 4), // Limit to 4 images per request
    });

    // Save images to database
    const savedImages = await Promise.all(
      generatedImages.map(async (imageData) => {
        const [savedImage] = await db
          .insert(images)
          .values({
            userId: session.user.id,
            imageUrl: imageData.imageData,
            isPublic: false, // Private by default
            likes: 0,
            views: 0,
          })
          .returning();

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