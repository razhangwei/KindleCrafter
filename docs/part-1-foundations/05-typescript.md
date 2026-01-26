# Chapter 5: TypeScript Essentials

## Learning Objectives

By the end of this chapter, you will:

- Understand why TypeScript exists and its benefits
- Know how to define types for variables, functions, and objects
- Work with interfaces and type aliases
- Use generics for reusable type-safe code
- Understand union types, optional properties, and type narrowing
- Read and write TypeScript code like KindleCrafter's

---

## Why TypeScript?

JavaScript is dynamically typed. Variables can hold any type, and types are checked at runtime:

```javascript
function greet(name) {
  return "Hello, " + name.toUpperCase();
}

greet("Alice");    // Works: "Hello, ALICE"
greet(42);         // Runtime error: name.toUpperCase is not a function
```

The bug isn't caught until the code runs. TypeScript catches it at compile time:

```typescript
function greet(name: string): string {
  return "Hello, " + name.toUpperCase();
}

greet("Alice");    // Works
greet(42);         // Error: Argument of type 'number' is not assignable to parameter of type 'string'
```

TypeScript is JavaScript with static types. It:
- Catches errors before runtime
- Provides autocomplete and documentation in editors
- Makes refactoring safer
- Serves as documentation for future developers

---

## Basic Types

### Primitive Types

```typescript
const message: string = "Hello";
const count: number = 42;
const isActive: boolean = true;
const nothing: null = null;
const notDefined: undefined = undefined;
```

### Arrays

```typescript
const numbers: number[] = [1, 2, 3];
const names: string[] = ["Alice", "Bob"];

// Alternative syntax
const values: Array<number> = [1, 2, 3];
```

### Objects

```typescript
const user: { name: string; age: number } = {
  name: "Alice",
  age: 30
};
```

### Type Inference

TypeScript often infers types, so you don't need to be explicit:

```typescript
const message = "Hello";     // TypeScript infers: string
const count = 42;            // TypeScript infers: number
const numbers = [1, 2, 3];   // TypeScript infers: number[]
```

Add explicit types when:
- The type isn't obvious from context
- You want to document the expected type
- TypeScript's inference isn't specific enough

---

## Functions

### Parameter and Return Types

```typescript
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (a: number, b: number): number => a * b;
```

### Optional Parameters

```typescript
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

greet("Alice");              // "Hello, Alice!"
greet("Alice", "Welcome");   // "Welcome, Alice!"
```

### Default Parameters

```typescript
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}
```

### Void Return Type

```typescript
function log(message: string): void {
  console.log(message);
  // No return value
}
```

### Never Return Type

```typescript
function throwError(message: string): never {
  throw new Error(message);
  // Function never returns normally
}
```

---

## Interfaces

Interfaces define the shape of objects:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};
```

### Optional Properties

```typescript
interface ConvertInput {
  markdown: string;
  filename: string;
  title?: string;     // Optional
  author?: string;    // Optional
}

// Both are valid:
const input1: ConvertInput = { markdown: "# Hi", filename: "hi.md" };
const input2: ConvertInput = { markdown: "# Hi", filename: "hi.md", title: "Hi" };
```

### Readonly Properties

```typescript
interface Config {
  readonly apiKey: string;
  readonly maxRetries: number;
}

const config: Config = { apiKey: "abc123", maxRetries: 3 };
config.apiKey = "xyz";  // Error: Cannot assign to 'apiKey' because it is a read-only property
```

### Extending Interfaces

```typescript
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  department: string;
  salary: number;
}

const emp: Employee = {
  name: "Alice",
  age: 30,
  department: "Engineering",
  salary: 100000
};
```

---

## Type Aliases

Type aliases create named types, similar to interfaces:

```typescript
type UserId = string;
type Point = { x: number; y: number };
type Status = "pending" | "active" | "completed";
```

### Interface vs Type Alias

Both can define object shapes:

```typescript
interface User {
  name: string;
}

type User = {
  name: string;
};
```

Key differences:
- Interfaces can be extended with `extends`
- Interfaces can be merged (declared twice)
- Type aliases can represent unions and primitives

Convention: Use interfaces for objects that might be extended, types for unions and simpler aliases.

---

## Union Types

A value can be one of several types:

```typescript
type Status = "loading" | "success" | "error";

function handleStatus(status: Status) {
  switch (status) {
    case "loading":
      return "Please wait...";
    case "success":
      return "Done!";
    case "error":
      return "Something went wrong.";
  }
}
```

### Union with Different Types

```typescript
type StringOrNumber = string | number;

function formatValue(value: StringOrNumber): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else {
    return value.toFixed(2);
  }
}
```

### Discriminated Unions

A powerful pattern for handling different cases:

```typescript
interface SuccessResult {
  success: true;
  data: string;
}

interface ErrorResult {
  success: false;
  error: string;
}

type Result = SuccessResult | ErrorResult;

function handleResult(result: Result) {
  if (result.success) {
    // TypeScript knows result is SuccessResult
    console.log(result.data);
  } else {
    // TypeScript knows result is ErrorResult
    console.log(result.error);
  }
}
```

KindleCrafter uses this pattern:

```typescript
// app/actions/convert.ts

interface ConvertResult {
  success: boolean;
  message: string;
  epubBase64?: string;
  filename?: string;
}
```

---

## Type Narrowing

TypeScript narrows types based on checks:

```typescript
function processValue(value: string | number | null) {
  // Here, value is: string | number | null

  if (value === null) {
    return "No value";
  }
  // Now value is: string | number

  if (typeof value === "string") {
    return value.toUpperCase();  // value is: string
  }

  return value * 2;  // value is: number
}
```

### Common Narrowing Techniques

```typescript
// typeof
if (typeof x === "string") { ... }

// Truthiness
if (x) { ... }  // Excludes null, undefined, "", 0, false

// Equality
if (x === null) { ... }

// in operator
if ("email" in user) { ... }

// instanceof
if (error instanceof Error) { ... }

// Custom type guard
function isString(value: unknown): value is string {
  return typeof value === "string";
}
```

---

## Generics

Generics create reusable components that work with multiple types:

```typescript
// Without generics - only works with numbers
function firstNumber(arr: number[]): number | undefined {
  return arr[0];
}

// With generics - works with any type
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

first([1, 2, 3]);          // Returns: number | undefined
first(["a", "b", "c"]);    // Returns: string | undefined
first([{ id: 1 }]);        // Returns: { id: number } | undefined
```

### Generic Interfaces

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

type UserResponse = ApiResponse<User>;
// Equivalent to:
// {
//   data: User;
//   status: number;
//   message: string;
// }
```

### Generic Constraints

```typescript
// T must have a 'length' property
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}

logLength("hello");    // Works
logLength([1, 2, 3]);  // Works
logLength(123);        // Error: number doesn't have 'length'
```

---

## Utility Types

TypeScript provides built-in utility types:

### Partial<T>

Makes all properties optional:

```typescript
interface User {
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// { name?: string; email?: string; }

// Useful for update functions
function updateUser(id: string, updates: Partial<User>) { ... }
```

### Pick<T, K>

Select specific properties:

```typescript
type UserName = Pick<User, "name">;
// { name: string; }
```

### Omit<T, K>

Remove specific properties:

```typescript
type UserWithoutEmail = Omit<User, "email">;
// { name: string; }
```

### Record<K, V>

Create an object type with specific key/value types:

```typescript
type StatusMap = Record<string, boolean>;
// { [key: string]: boolean }

const statuses: StatusMap = {
  loading: false,
  complete: true,
};
```

---

## TypeScript in KindleCrafter

Let's examine real TypeScript patterns from KindleCrafter:

### Server Action Interfaces

```typescript
// app/actions/convert.ts

interface ConvertInput {
  markdown: string;
  filename: string;
  title?: string;
  author?: string;
}

interface ConvertResult {
  success: boolean;
  message: string;
  epubBase64?: string;
  filename?: string;
}

export async function convertToEpub(input: ConvertInput): Promise<ConvertResult> {
  // ...
}
```

This defines:
- Clear input requirements (`markdown` and `filename` required, `title` and `author` optional)
- Clear output structure (always has `success` and `message`, optionally has `epubBase64` and `filename`)
- The function is async (returns a `Promise`)

### Component Props

```typescript
// components/conversion-form.tsx

interface ConversionFormProps {
  kindleEmailConfigured: boolean;
  emailServiceConfigured: boolean;
}

export function ConversionForm({
  kindleEmailConfigured,
  emailServiceConfigured,
}: ConversionFormProps) {
  // ...
}
```

Props are typed with interfaces. This ensures:
- Parent components pass the required props
- The component only accesses props that exist
- Editors provide autocomplete for prop names

### Database Schema Types

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

// Infer types from the schema
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
```

Drizzle ORM infers TypeScript types from your schema definition. This means:
- Query results are automatically typed
- Insert data is validated at compile time
- No separate type definitions to maintain

---

## TypeScript Configuration

KindleCrafter's `tsconfig.json` enables strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "module": "ESNext",
    "target": "ES2017",
    "lib": ["dom", "ES2017"],
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Key options:
- `strict: true`: Enables all strict type checks
- `noEmit: true`: Next.js handles compilation; TypeScript just checks types
- `paths`: Allows `@/lib/markdown` instead of `../../lib/markdown`

---

## Common Patterns

### Asserting Non-Null

When you know a value isn't null but TypeScript doesn't:

```typescript
const element = document.getElementById("app");
// element is: HTMLElement | null

element!.textContent = "Hello";  // ! asserts it's not null
// Use sparingly - prefer proper null checks
```

### Type Assertion

When you know better than TypeScript:

```typescript
const data = await response.json() as User;
// or
const data = <User>await response.json();
```

Use sparingly—prefer proper type definitions.

### The `unknown` Type

A safer alternative to `any`:

```typescript
function processInput(input: unknown) {
  // Can't use input directly - must narrow first
  if (typeof input === "string") {
    console.log(input.toUpperCase());  // Now it's safe
  }
}
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 5 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • TypeScript = JavaScript + static types                       │
│    Catches errors at compile time, not runtime                  │
│                                                                 │
│  • Basic types: string, number, boolean, null, undefined       │
│                                                                 │
│  • Functions: add types to parameters and return value         │
│    function add(a: number, b: number): number                   │
│                                                                 │
│  • Interfaces: define object shapes                             │
│    interface User { name: string; email: string; }             │
│                                                                 │
│  • Union types: value is one of several types                   │
│    type Status = "pending" | "active" | "completed"            │
│                                                                 │
│  • Generics: reusable type-safe code                           │
│    function first<T>(arr: T[]): T | undefined                   │
│                                                                 │
│  • Utility types: Partial<T>, Pick<T,K>, Omit<T,K>, Record<K,V>│
│                                                                 │
│  • Type narrowing: if (typeof x === "string") { ... }          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Type an API Response**: Define interfaces for a blog API that returns posts with `id`, `title`, `content`, and `author`. Include an `ApiResponse<T>` generic wrapper.

2. **Discriminated Union**: Create a `Result<T>` type that's either `{ success: true, data: T }` or `{ success: false, error: string }`. Write a function that handles both cases.

3. **Explore KindleCrafter Types**: Open `app/actions/convert.ts` and trace the types. How does `ConvertInput` flow through `convertToEpub`? What type does the function return?

---

## What's Next?

You now have the foundation: HTTP, HTML, CSS, JavaScript, and TypeScript. In Part II, we'll build on this to learn React—the library that revolutionized how we build user interfaces.

→ Continue to [Chapter 6: Introduction to React](../part-2-react/06-intro-to-react.md)
