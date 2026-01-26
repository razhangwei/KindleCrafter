# Appendix B: Quick Reference

A handy reference for TypeScript, React Hooks, Tailwind CSS, and common patterns.

---

## TypeScript Quick Reference

### Basic Types

```typescript
// Primitives
const name: string = "Alice";
const age: number = 30;
const active: boolean = true;

// Arrays
const numbers: number[] = [1, 2, 3];
const names: Array<string> = ["Alice", "Bob"];

// Objects
const user: { name: string; age: number } = { name: "Alice", age: 30 };

// Union types
const id: string | number = "abc";

// Optional
const title?: string;  // string | undefined
```

### Interfaces

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;  // Optional
  readonly createdAt: Date;  // Cannot be modified
}

// Extend interfaces
interface Employee extends User {
  department: string;
  salary: number;
}
```

### Type Aliases

```typescript
type Status = "pending" | "active" | "completed";
type Point = { x: number; y: number };
type UserId = string;
```

### Functions

```typescript
function greet(name: string): string {
  return `Hello, ${name}`;
}

const greet = (name: string): string => `Hello, ${name}`;

// Optional and default parameters
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}`;
}
```

### Generics

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

interface ApiResponse<T> {
  data: T;
  status: number;
}
```

### Utility Types

```typescript
Partial<T>       // All properties optional
Required<T>      // All properties required
Pick<T, K>       // Select specific properties
Omit<T, K>       // Remove specific properties
Record<K, V>     // Object type with key/value types
```

---

## React Hooks Quick Reference

### useState

```tsx
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// Update state
setCount(count + 1);
setCount(prev => prev + 1);  // Functional update

// Update object state
setUser(prev => ({ ...prev, name: "Bob" }));
```

### useEffect

```tsx
// Run on every render
useEffect(() => {
  console.log("Rendered");
});

// Run once on mount
useEffect(() => {
  console.log("Mounted");
}, []);

// Run when dependencies change
useEffect(() => {
  console.log("Count changed:", count);
}, [count]);

// Cleanup function
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
```

### useCallback

```tsx
// Memoize function to prevent re-creation
const handleClick = useCallback(() => {
  console.log("Clicked");
}, []);  // Empty deps = never changes

const handleSubmit = useCallback((data: Data) => {
  submitData(data, userId);
}, [userId]);  // Re-create when userId changes
```

### useMemo

```tsx
// Memoize expensive computation
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

### useRef

```tsx
const inputRef = useRef<HTMLInputElement>(null);

// Focus input
inputRef.current?.focus();

// In JSX
<input ref={inputRef} />
```

---

## Tailwind CSS Quick Reference

### Spacing (p = padding, m = margin)

| Class | Value |
|-------|-------|
| `p-0` | 0 |
| `p-1` | 0.25rem (4px) |
| `p-2` | 0.5rem (8px) |
| `p-4` | 1rem (16px) |
| `p-6` | 1.5rem (24px) |
| `p-8` | 2rem (32px) |

Directions: `px-`, `py-`, `pt-`, `pr-`, `pb-`, `pl-`

### Typography

| Class | Property |
|-------|----------|
| `text-xs` | font-size: 12px |
| `text-sm` | font-size: 14px |
| `text-base` | font-size: 16px |
| `text-lg` | font-size: 18px |
| `text-xl` | font-size: 20px |
| `font-medium` | font-weight: 500 |
| `font-semibold` | font-weight: 600 |
| `font-bold` | font-weight: 700 |

### Colors

```html
<div class="bg-white text-gray-900">Light</div>
<div class="bg-gray-900 text-white">Dark</div>
<div class="bg-blue-500">Blue</div>
<div class="bg-blue-500/50">Blue 50% opacity</div>
```

### Flexbox

```html
<div class="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

<div class="flex flex-col gap-2">
  <div>Top</div>
  <div>Bottom</div>
</div>
```

| Class | Property |
|-------|----------|
| `flex` | display: flex |
| `flex-col` | flex-direction: column |
| `items-center` | align-items: center |
| `justify-center` | justify-content: center |
| `justify-between` | justify-content: space-between |
| `gap-4` | gap: 1rem |
| `flex-1` | flex: 1 1 0% |

### Responsive

```html
<div class="p-4 md:p-8 lg:p-12">Responsive padding</div>
<div class="hidden md:block">Hidden on mobile</div>
<div class="flex flex-col md:flex-row">Stack → Row</div>
```

| Prefix | Min Width |
|--------|-----------|
| (none) | 0px (mobile first) |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

### States

```html
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">
<input class="border focus:border-blue-500 focus:ring-2">
<button class="disabled:opacity-50 disabled:cursor-not-allowed">
```

### Common Patterns

```html
<!-- Card -->
<div class="bg-white rounded-lg shadow p-6">

<!-- Button -->
<button class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">

<!-- Input -->
<input class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-ring">

<!-- Centered container -->
<div class="container mx-auto max-w-2xl px-4">
```

---

## Next.js Quick Reference

### File Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route component |
| `layout.tsx` | Shared layout |
| `loading.tsx` | Loading state |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 page |
| `route.ts` | API endpoint |

### Routing

```
app/
├── page.tsx            → /
├── about/page.tsx      → /about
├── posts/[id]/page.tsx → /posts/123
├── docs/[...slug]/page.tsx → /docs/a/b/c
```

### Server Actions

```typescript
// app/actions/example.ts
"use server";

export async function myAction(data: Data) {
  // Runs on server
  return { success: true };
}
```

### Navigation

```tsx
import Link from "next/link";
import { useRouter } from "next/navigation";

<Link href="/about">About</Link>

const router = useRouter();
router.push("/about");
```

### Metadata

```tsx
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description",
};
```

---

## Drizzle ORM Quick Reference

### Schema Definition

```typescript
import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Queries

```typescript
import { eq, and, or, gt, like } from "drizzle-orm";

// Select all
const users = await db.select().from(users);

// Select with condition
const [user] = await db.select().from(users).where(eq(users.id, id));

// Select specific columns
const emails = await db.select({ email: users.email }).from(users);

// Insert
await db.insert(users).values({ email: "a@b.com" });

// Update
await db.update(users).set({ name: "New" }).where(eq(users.id, id));

// Delete
await db.delete(users).where(eq(users.id, id));
```

---

## Git Quick Reference

```bash
# Clone
git clone <url>

# Status and diff
git status
git diff

# Stage and commit
git add <file>
git add .
git commit -m "message"

# Push and pull
git push origin main
git pull origin main

# Branches
git branch feature/name
git checkout feature/name
git checkout -b feature/name  # Create and switch

# Merge
git merge feature/name
```

---

## npm/Node Quick Reference

```bash
# Install dependencies
npm install
npm install <package>
npm install -D <package>  # Dev dependency

# Scripts
npm run dev
npm run build
npm run lint

# Update
npm update
npm outdated

# Info
npm list
npm info <package>
```
