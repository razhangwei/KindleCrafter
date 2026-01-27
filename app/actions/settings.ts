"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

/**
 * Get settings for the current authenticated user
 */
export async function getSettings() {
  if (!db) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);
    return userSettings || null;
  } catch {
    return null;
  }
}

/**
 * Get settings by user ID (for background jobs)
 */
export async function getSettingsByUserId(userId: string) {
  if (!db) {
    return null;
  }

  try {
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
    return userSettings || null;
  } catch {
    return null;
  }
}

/**
 * Update settings for the current authenticated user
 */
export async function updateSettings(kindleEmail: string) {
  if (!db) {
    throw new Error("Database not configured. Please set DATABASE_URL in .env.local");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to update settings");
  }

  const existing = await getSettings();

  if (existing) {
    await db
      .update(settings)
      .set({ kindleEmail, updatedAt: new Date() })
      .where(and(eq(settings.id, existing.id), eq(settings.userId, user.id)));
  } else {
    await db.insert(settings).values({
      userId: user.id,
      kindleEmail
    });
  }

  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
