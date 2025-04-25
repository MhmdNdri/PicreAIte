import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/data/env/schema";
import * as schema from "./schema";

export const db = drizzle({
  schema,
  connection: {
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    host: env.DATABASE_HOST,
  },
});
