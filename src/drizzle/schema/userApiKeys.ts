import { sql } from "drizzle-orm";
import { text, timestamp, pgTable, varchar } from "drizzle-orm/pg-core";

export const userApiKeys = pgTable("user_api_keys", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});
