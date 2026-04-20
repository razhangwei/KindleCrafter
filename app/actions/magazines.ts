"use server";

import { db } from "@/db";
import { recipes, recipeSchedules, type Recipe, type RecipeSchedule } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest";
import { isEmailConfigured } from "@/lib/email";
import { isModalConfigured } from "@/lib/modal";
import { getSettings } from "./settings";

// Helper to generate URL-friendly slugs
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

// Helper to calculate next run time from cron expression
// For MVP, we'll use simple parsing - a full cron parser would be better for production
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateNextRunTime(_cronExpression: string, _timezone: string): Date {
  // For now, just set next run to 1 hour from now as a fallback
  // In production, use a proper cron parser like "cron-parser"
  const now = new Date();
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export interface RecipeWithSchedule {
  recipe: Recipe;
  schedule: RecipeSchedule | null;
}

/**
 * Check if all required services are configured for magazine subscriptions
 */
export async function checkMagazinesConfigured(): Promise<{
  kindleEmail: boolean;
  emailService: boolean;
  modal: boolean;
}> {
  const settings = await getSettings();

  return {
    kindleEmail: !!settings?.kindleEmail,
    emailService: isEmailConfigured(),
    modal: isModalConfigured(),
  };
}

/**
 * Get all recipes with their schedules
 */
export async function getRecipes(): Promise<RecipeWithSchedule[]> {
  if (!db) {
    return [];
  }

  try {
    const allRecipes = await db.select().from(recipes).orderBy(recipes.name);
    const allSchedules = await db.select().from(recipeSchedules);

    // Map schedules by recipeId for quick lookup
    const scheduleByRecipeId = new Map<string, RecipeSchedule>();
    for (const schedule of allSchedules) {
      scheduleByRecipeId.set(schedule.recipeId, schedule);
    }

    return allRecipes.map((recipe) => ({
      recipe,
      schedule: scheduleByRecipeId.get(recipe.id) || null,
    }));
  } catch (error) {
    console.error("[getRecipes] Error:", error);
    return [];
  }
}

/**
 * Get a single recipe by ID
 */
export async function getRecipe(id: string): Promise<RecipeWithSchedule | null> {
  if (!db) {
    return null;
  }

  try {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);

    if (!recipe) {
      return null;
    }

    const [schedule] = await db
      .select()
      .from(recipeSchedules)
      .where(eq(recipeSchedules.recipeId, id))
      .limit(1);

    return { recipe, schedule: schedule || null };
  } catch (error) {
    console.error("[getRecipe] Error:", error);
    return null;
  }
}

export interface CreateRecipeInput {
  name: string;
  recipeContent: string; // Base64 encoded
  cronExpression: string;
  timezone: string;
  enabled?: boolean;
}

/**
 * Create a new recipe with schedule
 */
export async function createRecipe(
  input: CreateRecipeInput
): Promise<{ success: boolean; error?: string; recipeId?: string }> {
  if (!db) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const slug = generateSlug(input.name);

    // Check for duplicate slug
    const [existing] = await db.select().from(recipes).where(eq(recipes.slug, slug)).limit(1);
    if (existing) {
      return { success: false, error: "A recipe with a similar name already exists" };
    }

    // Insert recipe
    const [newRecipe] = await db
      .insert(recipes)
      .values({
        name: input.name,
        slug,
        recipeContent: input.recipeContent,
        enabled: input.enabled ?? true,
      })
      .returning();

    // Insert schedule
    const nextRunAt = calculateNextRunTime(input.cronExpression, input.timezone);
    await db.insert(recipeSchedules).values({
      recipeId: newRecipe.id,
      cronExpression: input.cronExpression,
      timezone: input.timezone,
      nextRunAt,
    });

    revalidatePath("/magazines");

    return { success: true, recipeId: newRecipe.id };
  } catch (error) {
    console.error("[createRecipe] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create recipe",
    };
  }
}

export interface UpdateRecipeInput {
  id: string;
  name?: string;
  recipeContent?: string;
  cronExpression?: string;
  timezone?: string;
  enabled?: boolean;
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(
  input: UpdateRecipeInput
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const recipeUpdates: Partial<Recipe> = {
      updatedAt: new Date(),
    };

    if (input.name) {
      recipeUpdates.name = input.name;
      recipeUpdates.slug = generateSlug(input.name);
    }
    if (input.recipeContent) {
      recipeUpdates.recipeContent = input.recipeContent;
    }
    if (input.enabled !== undefined) {
      recipeUpdates.enabled = input.enabled;
    }

    await db.update(recipes).set(recipeUpdates).where(eq(recipes.id, input.id));

    // Update schedule if provided
    if (input.cronExpression || input.timezone) {
      const scheduleUpdates: Partial<RecipeSchedule> = {
        updatedAt: new Date(),
      };

      if (input.cronExpression) {
        scheduleUpdates.cronExpression = input.cronExpression;
      }
      if (input.timezone) {
        scheduleUpdates.timezone = input.timezone;
      }

      // Recalculate next run time
      const [currentSchedule] = await db
        .select()
        .from(recipeSchedules)
        .where(eq(recipeSchedules.recipeId, input.id))
        .limit(1);

      if (currentSchedule) {
        const cron = input.cronExpression || currentSchedule.cronExpression;
        const tz = input.timezone || currentSchedule.timezone;
        scheduleUpdates.nextRunAt = calculateNextRunTime(cron, tz);

        await db
          .update(recipeSchedules)
          .set(scheduleUpdates)
          .where(eq(recipeSchedules.recipeId, input.id));
      }
    }

    revalidatePath("/magazines");
    revalidatePath(`/magazines/${input.id}`);

    return { success: true };
  } catch (error) {
    console.error("[updateRecipe] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update recipe",
    };
  }
}

/**
 * Delete a recipe (cascade deletes schedule)
 */
export async function deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not configured" };
  }

  try {
    await db.delete(recipes).where(eq(recipes.id, id));

    revalidatePath("/magazines");

    return { success: true };
  } catch (error) {
    console.error("[deleteRecipe] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete recipe",
    };
  }
}

/**
 * Trigger a recipe to run immediately
 */
export async function runRecipeNow(recipeId: string): Promise<{ success: boolean; message: string }> {
  // Pre-flight validation
  const settings = await getSettings();
  if (!settings?.kindleEmail) {
    return {
      success: false,
      message: "Please configure your Kindle email in Settings first.",
    };
  }

  if (!isEmailConfigured()) {
    return {
      success: false,
      message: "Email service is not configured. Please set up RESEND_API_KEY or Gmail credentials.",
    };
  }

  if (!isModalConfigured()) {
    return {
      success: false,
      message: "Modal is not configured. Please set MODAL_ENDPOINT_URL and MODAL_WEBHOOK_SECRET.",
    };
  }

  // Fetch recipe
  const recipeData = await getRecipe(recipeId);
  if (!recipeData) {
    return {
      success: false,
      message: "Recipe not found.",
    };
  }

  // Queue the job
  try {
    await inngest.send({
      name: "magazine/recipe.run",
      data: {
        recipeId,
        kindleEmail: settings.kindleEmail,
      },
    });

    return {
      success: true,
      message: `Started processing "${recipeData.recipe.name}". You'll receive it on your Kindle shortly.`,
    };
  } catch (error) {
    console.error("[runRecipeNow] Failed to queue job:", error);
    return {
      success: false,
      message: `Failed to start processing: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Toggle recipe enabled status
 */
export async function toggleRecipeEnabled(
  id: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not configured" };
  }

  try {
    await db
      .update(recipes)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(recipes.id, id));

    revalidatePath("/magazines");

    return { success: true };
  } catch (error) {
    console.error("[toggleRecipeEnabled] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle recipe",
    };
  }
}
