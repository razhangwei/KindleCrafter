import { inngest } from "@/lib/inngest";
import { extractPodcastAudio, transcribePodcast } from "@/lib/podcast";
import { parseMarkdown, removeFirstH1IfMatchesTitle } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle } from "@/lib/email";
import { executeRecipe } from "@/lib/modal";
import { db } from "@/db";
import { recipes, recipeSchedules } from "@/db/schema";
import { eq, lte, and, isNotNull } from "drizzle-orm";

interface TranscribePodcastEvent {
  name: "podcast/transcribe.requested";
  data: {
    podcastUrl: string;
    kindleEmail: string;
  };
}

export const transcribePodcastJob = inngest.createFunction(
  {
    id: "transcribe-podcast",
    retries: 2,
  },
  { event: "podcast/transcribe.requested" },
  async ({ event, step }) => {
    const { podcastUrl, kindleEmail } = event.data as TranscribePodcastEvent["data"];

    // Step 1: Extract audio URL from Apple Podcast
    const { audioUrl, metadata } = await step.run("extract-audio", async () => {
      console.log("[transcribePodcastJob] Extracting audio from:", podcastUrl);
      return extractPodcastAudio(podcastUrl);
    });

    // Step 2: Transcribe with Gemini
    const markdown = await step.run("transcribe", async () => {
      console.log("[transcribePodcastJob] Transcribing:", metadata.title);
      return transcribePodcast(audioUrl, metadata);
    });

    // Step 3: Convert to EPUB
    const epubBase64 = await step.run("generate-epub", async () => {
      console.log("[transcribePodcastJob] Generating EPUB");
      // Remove first H1 if it matches the title to avoid duplication on Kindle
      const processedMarkdown = removeFirstH1IfMatchesTitle(markdown, metadata.title);
      const html = await parseMarkdown(processedMarkdown);
      const epubBuffer = await generateEpub({
        title: metadata.title,
        author: metadata.podcastName,
        html,
      });
      return epubBuffer.toString("base64");
    });

    // Step 4: Send to Kindle
    await step.run("send-to-kindle", async () => {
      console.log("[transcribePodcastJob] Sending to Kindle:", kindleEmail);
      const epubBuffer = Buffer.from(epubBase64, "base64");
      await sendToKindle({
        to: kindleEmail,
        title: metadata.title,
        epubBuffer,
      });
    });

    console.log("[transcribePodcastJob] Complete:", metadata.title);

    return {
      success: true,
      title: metadata.title,
      podcastName: metadata.podcastName,
    };
  }
);

// ============================================================================
// Magazine Recipe Functions
// ============================================================================

interface RunMagazineRecipeEvent {
  name: "magazine/recipe.run";
  data: {
    recipeId: string;
    kindleEmail: string;
  };
}

/**
 * Execute a magazine recipe and send the result to Kindle
 */
export const runMagazineRecipeJob = inngest.createFunction(
  {
    id: "run-magazine-recipe",
    retries: 2,
  },
  { event: "magazine/recipe.run" },
  async ({ event, step }) => {
    const { recipeId, kindleEmail } = event.data as RunMagazineRecipeEvent["data"];

    // Step 1: Load recipe from database
    const recipeData = await step.run("load-recipe", async () => {
      if (!db) {
        throw new Error("Database not configured");
      }

      const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);

      if (!recipe) {
        throw new Error(`Recipe not found: ${recipeId}`);
      }

      console.log("[runMagazineRecipeJob] Loaded recipe:", recipe.name);

      return {
        id: recipe.id,
        name: recipe.name,
        recipeContent: recipe.recipeContent,
      };
    });

    // Step 2: Execute recipe via Modal
    const epubBase64 = await step.run("execute-recipe", async () => {
      console.log("[runMagazineRecipeJob] Executing recipe via Modal:", recipeData.name);

      const result = await executeRecipe({
        recipeContent: recipeData.recipeContent,
        recipeName: recipeData.name,
      });

      if (!result.success || !result.epubBase64) {
        throw new Error(result.error || "Failed to execute recipe");
      }

      console.log(
        `[runMagazineRecipeJob] Recipe executed in ${result.executionTimeMs}ms`
      );

      return result.epubBase64;
    });

    // Step 3: Send to Kindle
    await step.run("send-to-kindle", async () => {
      console.log("[runMagazineRecipeJob] Sending to Kindle:", kindleEmail);

      const epubBuffer = Buffer.from(epubBase64, "base64");
      await sendToKindle({
        to: kindleEmail,
        title: recipeData.name,
        epubBuffer,
      });
    });

    // Step 4: Update schedule status
    await step.run("update-schedule", async () => {
      if (!db) return;

      const now = new Date();

      // Get current schedule
      const [schedule] = await db
        .select()
        .from(recipeSchedules)
        .where(eq(recipeSchedules.recipeId, recipeId))
        .limit(1);

      if (schedule) {
        // Calculate next run time (simple: add 24 hours for daily)
        // For production, use a proper cron parser
        const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        await db
          .update(recipeSchedules)
          .set({
            lastRunAt: now,
            nextRunAt: nextRun,
            lastRunStatus: "success",
            lastRunError: null,
            runCount: schedule.runCount + 1,
            updatedAt: now,
          })
          .where(eq(recipeSchedules.id, schedule.id));
      }

      console.log("[runMagazineRecipeJob] Updated schedule status");
    });

    console.log("[runMagazineRecipeJob] Complete:", recipeData.name);

    return {
      success: true,
      recipeName: recipeData.name,
    };
  }
);

/**
 * Hourly scheduler that checks for due recipes and queues them for execution
 */
export const magazineSchedulerJob = inngest.createFunction(
  {
    id: "magazine-scheduler",
  },
  { cron: "0 * * * *" }, // Run every hour at minute 0
  async ({ step }) => {
    console.log("[magazineSchedulerJob] Checking for due recipes...");

    // Step 1: Find due recipes
    const dueRecipes = await step.run("find-due-recipes", async () => {
      if (!db) {
        console.log("[magazineSchedulerJob] Database not configured");
        return [];
      }

      const now = new Date();

      // Find recipes with nextRunAt <= now that are enabled
      const schedules = await db
        .select({
          scheduleId: recipeSchedules.id,
          recipeId: recipeSchedules.recipeId,
          recipeName: recipes.name,
          nextRunAt: recipeSchedules.nextRunAt,
        })
        .from(recipeSchedules)
        .innerJoin(recipes, eq(recipeSchedules.recipeId, recipes.id))
        .where(
          and(
            lte(recipeSchedules.nextRunAt, now),
            eq(recipes.enabled, true),
            isNotNull(recipeSchedules.nextRunAt)
          )
        );

      console.log(`[magazineSchedulerJob] Found ${schedules.length} due recipes`);

      return schedules;
    });

    if (dueRecipes.length === 0) {
      return { success: true, queued: 0 };
    }

    // Step 2: Get Kindle email from settings
    const kindleEmail = await step.run("get-kindle-email", async () => {
      if (!db) {
        throw new Error("Database not configured");
      }

      const { settings } = await import("@/db/schema");
      const [userSettings] = await db.select().from(settings).limit(1);

      if (!userSettings?.kindleEmail) {
        throw new Error("Kindle email not configured");
      }

      return userSettings.kindleEmail;
    });

    // Step 3: Queue each due recipe
    const queuedCount = await step.run("queue-recipes", async () => {
      let queued = 0;

      for (const recipe of dueRecipes) {
        try {
          await inngest.send({
            name: "magazine/recipe.run",
            data: {
              recipeId: recipe.recipeId,
              kindleEmail,
            },
          });

          console.log(`[magazineSchedulerJob] Queued: ${recipe.recipeName}`);
          queued++;
        } catch (error) {
          console.error(
            `[magazineSchedulerJob] Failed to queue ${recipe.recipeName}:`,
            error
          );
        }
      }

      return queued;
    });

    console.log(`[magazineSchedulerJob] Complete. Queued ${queuedCount} recipes.`);

    return {
      success: true,
      queued: queuedCount,
    };
  }
);
