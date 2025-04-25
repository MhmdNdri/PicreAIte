import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text().notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  imageUrl: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  budget: integer("budget").default(0).notNull(),
  balance: integer("balance").default(0).notNull(),
});
