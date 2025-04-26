import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "@/data/env/schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: true,
});

export const db = drizzle(pool, { schema });
