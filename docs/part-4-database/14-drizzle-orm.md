# Chapter 14: Drizzle ORM

## Learning Objectives

By the end of this chapter, you will:

- Understand what an ORM is and why to use one
- Define database schemas with Drizzle
- Perform CRUD operations with type-safe queries
- Use Drizzle's query builder
- Generate and run migrations
- See how KindleCrafter uses Drizzle

---

## What is an ORM?

ORM stands for **Object-Relational Mapping**. It bridges the gap between your code's objects and the database's tables:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WITHOUT ORM                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  // Write raw SQL strings                                       │
│  const result = await client.query(                            │
│    "SELECT * FROM settings WHERE id = $1",                     │
│    [settingsId]                                                 │
│  );                                                             │
│  const settings = result.rows[0];  // ← No type safety        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    WITH ORM (DRIZZLE)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  // Type-safe query builder                                     │
│  const [settings] = await db                                    │
│    .select()                                                    │
│    .from(settings)                                              │
│    .where(eq(settings.id, settingsId));                        │
│  // settings is typed as Settings | undefined                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Drizzle?

Drizzle is a modern TypeScript ORM that's:
- **Type-safe**: Queries are validated at compile time
- **Lightweight**: ~7.4KB, zero dependencies
- **SQL-like**: Query syntax mirrors SQL (easy to learn)
- **Flexible**: Raw SQL escape hatch when needed

---

## Defining Schemas

### KindleCrafter's Schema

```typescript
// db/schema.ts

import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  kindleEmail: text("kindle_email").notNull(),
  senderConfigured: boolean("sender_configured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Infer TypeScript types from schema
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

### Schema Breakdown

```typescript
// Import column types for PostgreSQL
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

// Define a table
export const settings = pgTable("settings", {
  //                         ↑ SQL table name

  // UUID column with auto-generated default
  id: uuid("id").primaryKey().defaultRandom(),
  //  ↑ type  ↑ SQL column name  ↑ constraints

  // Text column, required
  kindleEmail: text("kindle_email").notNull(),
  //           ↑ column type       ↑ NOT NULL constraint

  // Boolean with default value
  senderConfigured: boolean("sender_configured").default(false).notNull(),

  // Timestamp with default to current time
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Column Types

| Drizzle | PostgreSQL | TypeScript |
|---------|------------|------------|
| `uuid()` | UUID | `string` |
| `text()` | TEXT | `string` |
| `varchar(n)` | VARCHAR(n) | `string` |
| `integer()` | INTEGER | `number` |
| `boolean()` | BOOLEAN | `boolean` |
| `timestamp()` | TIMESTAMP | `Date` |
| `json()` | JSON | `unknown` |
| `jsonb()` | JSONB | `unknown` |

### Type Inference

```typescript
// Type for reading (SELECT)
export type Settings = typeof settings.$inferSelect;
// Equivalent to:
// {
//   id: string;
//   kindleEmail: string;
//   senderConfigured: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// Type for writing (INSERT)
export type NewSettings = typeof settings.$inferInsert;
// Equivalent to:
// {
//   id?: string;           // optional (has default)
//   kindleEmail: string;   // required
//   senderConfigured?: boolean;  // optional (has default)
//   createdAt?: Date;      // optional (has default)
//   updatedAt?: Date;      // optional (has default)
// }
```

---

## Database Connection

```typescript
// db/index.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  // Return null if database isn't configured
  if (!connectionString || connectionString.includes("[project-ref]")) {
    return null;
  }

  // Create postgres client
  const client = postgres(connectionString, { prepare: false });

  // Create Drizzle instance with schema
  return drizzle(client, { schema });
}

export const db = createDb();
```

Key points:
- Uses `postgres` driver for the connection
- Returns `null` if DATABASE_URL isn't set (graceful degradation—Chapter 15)
- `{ schema }` enables the relational query API

---

## CRUD Operations

### Create (INSERT)

```typescript
// Insert a new record
await db.insert(settings).values({
  kindleEmail: "user@kindle.com",
  // id, createdAt, updatedAt have defaults
});

// Insert with all values
await db.insert(settings).values({
  id: "custom-id",
  kindleEmail: "user@kindle.com",
  senderConfigured: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Insert and return the created record
const [newSettings] = await db
  .insert(settings)
  .values({ kindleEmail: "user@kindle.com" })
  .returning();
```

### Read (SELECT)

```typescript
import { eq } from "drizzle-orm";

// Get all records
const allSettings = await db.select().from(settings);

// Get one record (array with single item)
const [firstSettings] = await db.select().from(settings).limit(1);

// Get with condition
const [found] = await db
  .select()
  .from(settings)
  .where(eq(settings.id, someId));

// Get specific columns
const emails = await db
  .select({ email: settings.kindleEmail })
  .from(settings);
// Result: [{ email: "user@kindle.com" }]
```

### Update

```typescript
import { eq } from "drizzle-orm";

// Update by ID
await db
  .update(settings)
  .set({
    kindleEmail: "new@kindle.com",
    updatedAt: new Date(),
  })
  .where(eq(settings.id, settingsId));

// Update and return
const [updated] = await db
  .update(settings)
  .set({ kindleEmail: "new@kindle.com" })
  .where(eq(settings.id, settingsId))
  .returning();
```

### Delete

```typescript
import { eq } from "drizzle-orm";

// Delete by ID
await db.delete(settings).where(eq(settings.id, settingsId));

// Delete and return
const [deleted] = await db
  .delete(settings)
  .where(eq(settings.id, settingsId))
  .returning();
```

---

## Query Operators

```typescript
import { eq, ne, gt, gte, lt, lte, like, and, or, isNull, inArray } from "drizzle-orm";

// Equality
eq(settings.id, "abc")         // id = 'abc'
ne(settings.id, "abc")         // id != 'abc'

// Comparison
gt(users.age, 18)              // age > 18
gte(users.age, 18)             // age >= 18
lt(users.age, 65)              // age < 65
lte(users.age, 65)             // age <= 65

// Pattern matching
like(users.name, "Al%")        // name LIKE 'Al%'

// Null checks
isNull(users.email)            // email IS NULL

// Array membership
inArray(users.role, ["admin", "mod"])  // role IN ('admin', 'mod')

// Logical operators
and(eq(users.active, true), gt(users.age, 18))
or(eq(users.role, "admin"), eq(users.role, "mod"))
```

---

## KindleCrafter's Queries

### getSettings

```typescript
// app/actions/settings.ts

export async function getSettings() {
  if (!db) {
    return null;  // Database not configured
  }

  try {
    // Get the first (and only) settings record
    const [userSettings] = await db.select().from(settings).limit(1);
    return userSettings || null;
  } catch {
    return null;
  }
}
```

### updateSettings

```typescript
// app/actions/settings.ts

export async function updateSettings(kindleEmail: string) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const existing = await getSettings();

  if (existing) {
    // Update existing record
    await db
      .update(settings)
      .set({
        kindleEmail,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, existing.id));
  } else {
    // Create new record
    await db.insert(settings).values({ kindleEmail });
  }

  // Tell Next.js to refresh cached data
  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
```

This "upsert" pattern:
1. Check if a record exists
2. If yes, update it
3. If no, create it

---

## Migrations

Migrations track schema changes over time:

### Generate Migration

```bash
# Creates a SQL migration file in drizzle/ folder
npx drizzle-kit generate
```

This compares your schema.ts to the database and generates SQL:

```sql
-- drizzle/0001_create_settings.sql
CREATE TABLE "settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "kindle_email" text NOT NULL,
  "sender_configured" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

### Push Schema (Development)

```bash
# Apply schema directly (no migration files)
npx drizzle-kit push
```

Good for rapid development—directly syncs schema to database.

### Run Migrations (Production)

```bash
# Apply all pending migrations
npx drizzle-kit migrate
```

---

## Drizzle Configuration

```typescript
// drizzle.config.ts

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 14 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Drizzle ORM: type-safe database queries in TypeScript       │
│                                                                 │
│  • Schema definition with pgTable:                             │
│    export const users = pgTable("users", { ... })              │
│                                                                 │
│  • Type inference:                                              │
│    type User = typeof users.$inferSelect                       │
│    type NewUser = typeof users.$inferInsert                    │
│                                                                 │
│  • CRUD operations:                                             │
│    db.insert(table).values({...})                              │
│    db.select().from(table).where(eq(...))                      │
│    db.update(table).set({...}).where(eq(...))                  │
│    db.delete(table).where(eq(...))                             │
│                                                                 │
│  • Migrations:                                                  │
│    drizzle-kit generate → creates SQL files                    │
│    drizzle-kit push → applies schema (dev)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Define a Schema**: Create a `users` table with id, email, name, and created_at columns. Define the TypeScript types.

2. **Write Queries**: Practice writing select, insert, update, and delete operations.

3. **Trace KindleCrafter**: Follow the path from `updateSettings` being called to the database being updated. What SQL would this generate?

---

## What's Next?

What happens when the database isn't configured? In Chapter 15, we'll explore graceful degradation—building apps that work even when optional services are unavailable.

→ Continue to [Chapter 15: Graceful Degradation](./15-graceful-degradation.md)
