# Chapter 13: Database Fundamentals

## Learning Objectives

By the end of this chapter, you will:

- Understand why web applications need databases
- Know the basics of relational databases and SQL
- Understand tables, columns, rows, and primary keys
- Know what Supabase is and how to set it up
- See how KindleCrafter's database is structured

---

## Why Databases?

Consider KindleCrafter without a database:
- How would you store the user's Kindle email?
- Where would settings persist after the server restarts?
- How would you track conversion history?

Databases provide **persistent storage** that survives server restarts and can be accessed from multiple servers.

### Types of Databases

| Type | Examples | Best For |
|------|----------|----------|
| **Relational (SQL)** | PostgreSQL, MySQL, SQLite | Structured data, transactions, relations |
| **Document (NoSQL)** | MongoDB, CouchDB | Flexible schemas, nested data |
| **Key-Value** | Redis, DynamoDB | Simple lookups, caching |
| **Vector** | Pinecone, pgvector | AI/ML embeddings, similarity search |

KindleCrafter uses **PostgreSQL**, a powerful open-source relational database.

---

## Relational Database Concepts

### Tables

A table is like a spreadsheet with defined columns:

```
┌──────────────────────────────────────────────────────────────────┐
│                         settings table                            │
├──────────┬──────────────────────┬───────────┬────────────────────┤
│    id    │     kindle_email     │ created_at│    updated_at      │
├──────────┼──────────────────────┼───────────┼────────────────────┤
│ abc-123  │ user@kindle.com      │ 2024-01-01│ 2024-01-15        │
│ def-456  │ other@kindle.com     │ 2024-02-01│ 2024-02-01        │
└──────────┴──────────────────────┴───────────┴────────────────────┘
```

### Columns

Each column has a name and data type:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `kindle_email` | TEXT | User's Kindle email |
| `created_at` | TIMESTAMP | When the record was created |
| `updated_at` | TIMESTAMP | When the record was last modified |

### Rows

Each row is a record (one instance of data):

```sql
-- One row of data
id: "abc-123"
kindle_email: "user@kindle.com"
created_at: "2024-01-01 10:00:00"
updated_at: "2024-01-15 14:30:00"
```

### Primary Keys

Every row needs a unique identifier:

```sql
id UUID PRIMARY KEY
```

UUIDs (Universally Unique Identifiers) are random strings like `550e8400-e29b-41d4-a716-446655440000`. They're better than auto-incrementing integers because they can be generated anywhere (client or server) without coordination.

---

## SQL Basics

SQL (Structured Query Language) is how you talk to relational databases:

### SELECT - Reading Data

```sql
-- Get all settings
SELECT * FROM settings;

-- Get specific columns
SELECT kindle_email, created_at FROM settings;

-- Filter with WHERE
SELECT * FROM settings WHERE id = 'abc-123';

-- Limit results
SELECT * FROM settings LIMIT 1;
```

### INSERT - Creating Data

```sql
INSERT INTO settings (id, kindle_email, created_at, updated_at)
VALUES ('abc-123', 'user@kindle.com', NOW(), NOW());
```

### UPDATE - Modifying Data

```sql
UPDATE settings
SET kindle_email = 'new@kindle.com', updated_at = NOW()
WHERE id = 'abc-123';
```

### DELETE - Removing Data

```sql
DELETE FROM settings WHERE id = 'abc-123';
```

---

## Supabase

Supabase is a "backend-as-a-service" built on PostgreSQL. It provides:

- **Managed PostgreSQL database**: No server setup
- **REST API**: Automatic API generation from tables
- **Authentication**: Built-in user auth (we don't use this in KindleCrafter)
- **Real-time**: Subscribe to database changes
- **Storage**: File storage (S3-compatible)

For KindleCrafter, we use Supabase as a simple PostgreSQL host and connect directly with Drizzle ORM.

### Setting Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string from Settings → Database → Connection String
4. Add to `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

---

## KindleCrafter's Database Schema

KindleCrafter has one table: `settings`

```
┌──────────────────────────────────────────────────────────────────┐
│                         settings                                  │
├────────────────────┬─────────────┬───────────────────────────────┤
│       Column       │    Type     │         Constraints           │
├────────────────────┼─────────────┼───────────────────────────────┤
│ id                 │ UUID        │ PRIMARY KEY, DEFAULT random   │
│ kindle_email       │ TEXT        │ NOT NULL                      │
│ sender_configured  │ BOOLEAN     │ NOT NULL, DEFAULT false       │
│ created_at         │ TIMESTAMP   │ NOT NULL, DEFAULT now()       │
│ updated_at         │ TIMESTAMP   │ NOT NULL, DEFAULT now()       │
└────────────────────┴─────────────┴───────────────────────────────┘
```

### Why Just One Table?

KindleCrafter is designed for personal use:
- Single user (no user accounts)
- Simple settings (just Kindle email)
- No conversion history needed

A multi-user version would have:
- `users` table
- `settings` linked to users via foreign key
- `conversions` table for history

---

## Database Schema Definition

Instead of writing SQL by hand, we use Drizzle ORM to define schemas in TypeScript:

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

// TypeScript types inferred from schema
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

This defines:
- Table name: `settings`
- Columns with types and constraints
- TypeScript types for reading (`Settings`) and writing (`NewSettings`)

We'll explore Drizzle in detail in Chapter 14.

---

## Data Modeling Concepts

### Normalization

Don't repeat data—reference it instead:

```
❌ Denormalized (repetition)
┌─────────────────────────────────────────────────────────────┐
│ conversions                                                  │
├──────┬────────────────┬───────────┬───────────┬────────────┤
│ id   │ user_email     │ user_name │ title     │ created_at │
├──────┼────────────────┼───────────┼───────────┼────────────┤
│ 1    │ alice@mail.com │ Alice     │ Book 1    │ 2024-01-01 │
│ 2    │ alice@mail.com │ Alice     │ Book 2    │ 2024-01-02 │
│ 3    │ alice@mail.com │ Alice     │ Book 3    │ 2024-01-03 │
└──────┴────────────────┴───────────┴───────────┴────────────┘
  ↑ User info repeated for every conversion

✅ Normalized (references)
┌─────────────────────────────────────┐
│ users                                │
├──────┬────────────────┬────────────┤
│ id   │ email          │ name       │
├──────┼────────────────┼────────────┤
│ 1    │ alice@mail.com │ Alice      │
└──────┴────────────────┴────────────┘

┌─────────────────────────────────────────────────┐
│ conversions                                      │
├──────┬─────────┬───────────┬────────────────────┤
│ id   │ user_id │ title     │ created_at         │
├──────┼─────────┼───────────┼────────────────────┤
│ 1    │ 1       │ Book 1    │ 2024-01-01         │
│ 2    │ 1       │ Book 2    │ 2024-01-02         │
│ 3    │ 1       │ Book 3    │ 2024-01-03         │
└──────┴─────────┴───────────┴────────────────────┘
  ↑ Just references user by ID
```

### Foreign Keys

Link tables together:

```sql
user_id UUID REFERENCES users(id)
```

This ensures:
- `user_id` must exist in the `users` table
- Can't delete a user who has conversions
- Data integrity is maintained

### Indexes

Speed up queries on specific columns:

```sql
CREATE INDEX idx_conversions_user_id ON conversions(user_id);
```

KindleCrafter's single-record pattern doesn't need indexes.

---

## Single-Record Pattern

KindleCrafter uses a simple pattern: one settings record for the whole app:

```typescript
// Get the one settings record
const [settings] = await db.select().from(settings).limit(1);

// Upsert: update if exists, insert if not
const existing = await getSettings();
if (existing) {
  await db.update(settings).set({ kindleEmail }).where(eq(settings.id, existing.id));
} else {
  await db.insert(settings).values({ kindleEmail });
}
```

This works because:
- KindleCrafter is single-user
- We only need one settings record
- The first (and only) record is "the" settings

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 13 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Databases persist data across server restarts               │
│                                                                 │
│  • Relational databases: tables with columns and rows          │
│    Each row has a primary key (unique identifier)              │
│                                                                 │
│  • SQL operations: SELECT, INSERT, UPDATE, DELETE              │
│                                                                 │
│  • Supabase: managed PostgreSQL hosting                        │
│    Connection string in DATABASE_URL                           │
│                                                                 │
│  • KindleCrafter's schema: one settings table                  │
│    id, kindle_email, sender_configured, timestamps             │
│                                                                 │
│  • Single-record pattern: LIMIT 1 for single-user apps         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Create a Supabase Project**: Sign up for Supabase and create a new project. Find your connection string.

2. **Explore the Dashboard**: Supabase has a table editor. Try creating a table manually and adding some rows.

3. **Design a Schema**: How would you extend KindleCrafter to track conversion history? Sketch the tables and columns you'd need.

---

## What's Next?

Raw SQL is verbose and error-prone. In Chapter 14, we'll learn Drizzle ORM—a TypeScript-first database toolkit that gives you type-safe queries and automatic migrations.

→ Continue to [Chapter 14: Drizzle ORM](./14-drizzle-orm.md)
