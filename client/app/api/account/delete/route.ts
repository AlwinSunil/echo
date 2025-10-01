import { auth } from "@/lib/auth";
import { db, users, accounts, sessions, images, prompts, userStats, userSubscriptions, userEarnings, creditPurchases, promptPurchases, promptUsage, imageLikes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete user data in order (respecting foreign key constraints)
    // Start with dependent tables first
    await db.delete(imageLikes).where(eq(imageLikes.userId, userId));
    await db.delete(promptUsage).where(eq(promptUsage.userId, userId));
    await db.delete(creditPurchases).where(eq(creditPurchases.userId, userId));
    await db.delete(promptPurchases).where(eq(promptPurchases.buyerId, userId));
    await db.delete(promptPurchases).where(eq(promptPurchases.sellerId, userId));
    await db.delete(userEarnings).where(eq(userEarnings.userId, userId));
    await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId));
    await db.delete(userStats).where(eq(userStats.userId, userId));
    await db.delete(images).where(eq(images.userId, userId));
    await db.delete(prompts).where(eq(prompts.userId, userId));
    
    // Delete auth-related tables
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
