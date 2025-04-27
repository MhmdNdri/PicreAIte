import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const PromptTable = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  promptDesc: text("prompt_desc").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp({ withTimezone: true }),
});
