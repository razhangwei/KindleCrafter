"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  if (!db) {
    return null;
  }

  try {
    const [userSettings] = await db.select().from(settings).limit(1);
    return userSettings || null;
  } catch {
    return null;
  }
}

export async function updateSettings(kindleEmail: string) {
  if (!db) {
    throw new Error("Database not configured. Please set DATABASE_URL in .env.local");
  }

  const existing = await getSettings();

  if (existing) {
    await db
      .update(settings)
      .set({ kindleEmail, updatedAt: new Date() })
      .where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values({ kindleEmail });
  }

  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
