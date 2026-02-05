import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  kindleEmail: text("kindle_email").notNull(),
  senderConfigured: boolean("sender_configured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

// Recipes for magazine subscriptions (Calibre recipe files)
export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  recipeContent: text("recipe_content").notNull(), // Base64 encoded .recipe file
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

// Schedules for recipe execution
export const recipeSchedules = pgTable("recipe_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  cronExpression: text("cron_expression").notNull(), // e.g., "0 6 * * *" for 6 AM daily
  timezone: text("timezone").notNull().default("UTC"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  lastRunStatus: text("last_run_status"), // "success" | "failed" | null
  lastRunError: text("last_run_error"),
  runCount: integer("run_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RecipeSchedule = typeof recipeSchedules.$inferSelect;
export type NewRecipeSchedule = typeof recipeSchedules.$inferInsert;
