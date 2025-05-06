import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { UserTable } from "./users";
import { sql } from "drizzle-orm";

export const savedImages = pgTable("saved_images", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.clerkUserId),
  imageUrl: text("image_url").notNull(),
  imageKey: varchar("image_key", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageType: varchar("image_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
    .notNull()
    .default(sql`NOW() + INTERVAL '24 hours'`),
});

export type SavedImage = typeof savedImages.$inferSelect;
export type NewSavedImage = typeof savedImages.$inferInsert;
