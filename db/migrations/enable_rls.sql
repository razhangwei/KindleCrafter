-- Enable Row Level Security on tables not managed by Drizzle schema.
-- Run this once via the Supabase SQL Editor or psql.
--
-- The `settings` table RLS is managed via db/schema.ts (.enableRLS())
-- and is applied automatically by `npx drizzle-kit push`.
--
-- The tables below exist in the database but are not part of the Drizzle
-- schema, so they must be handled with this manual migration.

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_schedules ENABLE ROW LEVEL SECURITY;
