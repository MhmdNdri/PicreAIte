import { defineConfig } from "drizzle-kit";
import { env } from "./src/data/env/schema";

// Parse connection string to get individual credentials
const connectionString = new URL(env.DATABASE_URL);
const host = connectionString.hostname;
const user = connectionString.username;
const password = connectionString.password;
const database = connectionString.pathname.slice(1); // Remove leading '/'

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    host,
    user,
    password,
    database,
    ssl: true,
  },
});
