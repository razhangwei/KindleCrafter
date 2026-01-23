import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("[project-ref]")) {
    return null;
  }

  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export const db = createDb();
