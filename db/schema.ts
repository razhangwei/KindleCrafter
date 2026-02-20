import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  kindleEmail: text("kindle_email").notNull(),
  senderConfigured: boolean("sender_configured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
