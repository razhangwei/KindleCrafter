# Chapter 9: Server vs Client Components

## Learning Objectives

By the end of this chapter, you will:

- Understand the difference between Server and Client Components
- Know when to use each type
- Use the "use client" directive correctly
- Pass data from Server to Client Components
- Avoid common mistakes in the RSC model
- See how KindleCrafter uses both types

---

## The Big Picture

React Server Components (RSC) split your React code into two environments:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER SIDE                                 │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │              Server Components                         │    │
│   │                                                        │    │
│   │  • Run only on the server                             │    │
│   │  • Can access databases, files, secrets               │    │
│   │  • Can be async (await data)                          │    │
│   │  • Cannot use hooks (useState, useEffect)             │    │
│   │  • Cannot handle events (onClick)                     │    │
│   │  • Rendered to HTML, sent to browser                  │    │
│   └───────────────────────────────────────────────────────┘    │
│                              │                                  │
│                    props (serialized)                          │
│                              ↓                                  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                                 │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │              Client Components                         │    │
│   │                                                        │    │
│   │  • Run in the browser (and on server for SSR)         │    │
│   │  • Can use hooks (useState, useEffect, useCallback)   │    │
│   │  • Can handle events (onClick, onChange)              │    │
│   │  • Cannot access server resources directly            │    │
│   │  • Code is shipped to the browser                     │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Server Components (Default)

In Next.js App Router, components are Server Components by default:

```tsx
// app/page.tsx - This is a Server Component

import { db } from "@/db";
import { settings } from "@/db/schema";

export default async function HomePage() {
  // ✅ Can query the database directly
  const [userSettings] = await db.select().from(settings).limit(1);

  // ✅ Can access environment variables
  const apiKey = process.env.SECRET_API_KEY;

  // ✅ Can read files from the filesystem
  const content = await fs.readFile("./data.json", "utf-8");

  return (
    <div>
      <h1>Welcome</h1>
      {/* ❌ Cannot use onClick here */}
      {/* <button onClick={() => {}}>Click</button> */}
    </div>
  );
}
```

### What Server Components Can Do

- Query databases
- Read environment variables (including secrets)
- Read files from the filesystem
- Call internal APIs
- Use `async/await` directly in the component
- Import large libraries without affecting bundle size

### What Server Components Cannot Do

- Use `useState`, `useEffect`, or other hooks
- Handle browser events (`onClick`, `onChange`)
- Access browser APIs (`window`, `document`, `localStorage`)
- Use context providers that require client-side state

---

## Client Components

Add `"use client"` at the top of a file to make it a Client Component:

```tsx
// components/counter.tsx
"use client";

import { useState } from "react";

export function Counter() {
  // ✅ Can use hooks
  const [count, setCount] = useState(0);

  return (
    // ✅ Can handle events
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### What Client Components Can Do

- Use hooks (`useState`, `useEffect`, `useContext`, etc.)
- Handle browser events
- Access browser APIs (`window`, `document`)
- Use third-party libraries that require browser APIs
- Maintain interactive state

### What Client Components Cannot Do

- Directly access databases or server secrets
- Use `async/await` in the component body
- Import Server Components (but can render them as children)

---

## The "use client" Directive

```tsx
"use client";  // Must be at the very top of the file

import { useState } from "react";
// ...
```

Important: `"use client"` creates a **boundary**. Everything imported by this file becomes client-side:

```
Server Component
    │
    ├─→ Server Component
    │
    └─→ "use client" ──┬──→ Client Component
                       │
                       ├──→ Client Component (imported)
                       │
                       └──→ Client Component (imported)
```

---

## Passing Data from Server to Client

Server Components pass data to Client Components via props:

```tsx
// app/page.tsx (Server Component)
import { ConversionForm } from "@/components/conversion-form";
import { getSettings } from "@/app/actions/settings";

export default async function HomePage() {
  // Fetch data on the server
  const settings = await getSettings();

  // Pass to client component as props
  return (
    <ConversionForm
      kindleEmailConfigured={!!settings?.kindleEmail}
    />
  );
}
```

```tsx
// components/conversion-form.tsx (Client Component)
"use client";

interface ConversionFormProps {
  kindleEmailConfigured: boolean;
}

export function ConversionForm({ kindleEmailConfigured }: ConversionFormProps) {
  // Use the prop in client-side logic
  return (
    <button disabled={!kindleEmailConfigured}>
      Send to Kindle
    </button>
  );
}
```

### Serialization Requirements

Props passed from Server to Client must be **serializable** (convertible to JSON):

```tsx
// ✅ Works - primitives and plain objects
<ClientComponent
  name="Alice"
  count={42}
  items={["a", "b", "c"]}
  config={{ enabled: true }}
/>

// ❌ Doesn't work - functions can't be serialized
<ClientComponent onClick={() => console.log("hi")} />

// ❌ Doesn't work - class instances can't be serialized
<ClientComponent date={new Date()} />
```

---

## KindleCrafter's Component Split

Let's examine how KindleCrafter splits Server and Client Components:

### Server Component: app/page.tsx

```tsx
// app/page.tsx - Server Component (no "use client")

import { ConversionForm } from "@/components/conversion-form";
import { getSettings } from "@/app/actions/settings";
import { checkEmailConfigured } from "@/app/actions/convert";

export default async function HomePage() {
  // These run on the server - can access database
  const settings = await getSettings();
  const emailConfigured = await checkEmailConfigured();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Convert Markdown to EPUB</h1>

      {/* Render client component with server-fetched data */}
      <ConversionForm
        kindleEmailConfigured={!!settings?.kindleEmail}
        emailServiceConfigured={emailConfigured}
      />
    </div>
  );
}
```

### Client Component: components/conversion-form.tsx

```tsx
// components/conversion-form.tsx - Client Component
"use client";

import { useState, useCallback } from "react";
// ... other imports

interface ConversionFormProps {
  kindleEmailConfigured: boolean;
  emailServiceConfigured: boolean;
}

export function ConversionForm({
  kindleEmailConfigured,
  emailServiceConfigured,
}: ConversionFormProps) {
  // ✅ Can use hooks
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Can use callbacks for events
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    // ...
  }, []);

  // ✅ Can handle click events
  const handleDownload = async () => {
    // ...
  };

  return (
    <div>
      {/* Interactive UI elements */}
      <button onClick={handleDownload} disabled={isLoading}>
        Download
      </button>
    </div>
  );
}
```

### The Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         SERVER                                  │
│                                                                 │
│  HomePage (Server Component)                                   │
│    │                                                           │
│    ├── await getSettings()  ──────→ Database Query            │
│    │         ↓                                                 │
│    │   settings = { kindleEmail: "user@kindle.com" }          │
│    │                                                           │
│    ├── await checkEmailConfigured() ──→ Check env vars        │
│    │         ↓                                                 │
│    │   emailConfigured = true                                  │
│    │                                                           │
│    └── Render ConversionForm with props                        │
│               ↓                                                │
│         <ConversionForm                                        │
│           kindleEmailConfigured={true}    ← serialized        │
│           emailServiceConfigured={true}                        │
│         />                                                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTML + hydration data
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
│                                                                 │
│  ConversionForm (Client Component)                             │
│    │                                                           │
│    ├── Receives props: { kindleEmailConfigured: true, ... }  │
│    │                                                           │
│    ├── useState, useCallback (hooks work here)                │
│    │                                                           │
│    └── Handles onClick, onChange (events work here)           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Common Patterns

### Pattern 1: Server Data to Client Interactive UI

```tsx
// Server Component - fetches data
async function ProductPage({ id }) {
  const product = await getProduct(id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Client component for interactive features */}
      <AddToCartButton productId={product.id} price={product.price} />
    </div>
  );
}
```

```tsx
// Client Component - handles interaction
"use client";

function AddToCartButton({ productId, price }) {
  const [added, setAdded] = useState(false);

  return (
    <button onClick={() => {
      addToCart(productId);
      setAdded(true);
    }}>
      {added ? "Added!" : `Add to Cart - $${price}`}
    </button>
  );
}
```

### Pattern 2: Children as Server Components

Client Components can render Server Components as children:

```tsx
// Server Component
async function Comments() {
  const comments = await getComments();
  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;
}

// Client Component
"use client";
function Modal({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <div className="modal">{children}</div>}
    </>
  );
}

// Usage in Server Component
function Page() {
  return (
    <Modal>
      <Comments />  {/* Server Component as child */}
    </Modal>
  );
}
```

---

## Common Mistakes

### Mistake 1: Adding "use client" to Everything

```tsx
// ❌ Don't do this - loses server benefits
"use client";

export default function AboutPage() {
  // This could be a Server Component
  return <div>About us...</div>;
}
```

### Mistake 2: Trying to Use Hooks in Server Components

```tsx
// ❌ Will error
export default function Page() {
  const [count, setCount] = useState(0);  // Error!
  return <div>{count}</div>;
}
```

### Mistake 3: Passing Functions as Props

```tsx
// Server Component
function Page() {
  // ❌ Can't pass functions to client components
  return <ClientComp onClick={() => console.log("hi")} />;
}

// ✅ Instead, use Server Actions (Chapter 10)
```

### Mistake 4: Importing Client Components Wrong

```tsx
"use client";

// ❌ This makes db a client module - will error
import { db } from "@/db";
```

---

## Decision Guide

```
┌────────────────────────────────────────────────────────────────┐
│                 SHOULD THIS BE A CLIENT COMPONENT?             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  Does it use useState, useEffect,     │
         │  useContext, or other hooks?           │
         └────────────────────┬───────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ Yes                           │ No
              ▼                               ▼
        ┌──────────┐           ┌─────────────────────────────┐
        │ "use     │           │ Does it handle events like  │
        │ client"  │           │ onClick, onChange, onSubmit?│
        └──────────┘           └─────────────┬───────────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │ Yes                         │ No
                              ▼                             ▼
                        ┌──────────┐            ┌───────────────────┐
                        │ "use     │            │ Keep as Server    │
                        │ client"  │            │ Component         │
                        └──────────┘            └───────────────────┘
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 9 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • Server Components: default, run on server, can fetch data   │
│    - Can use async/await, access databases, read env vars     │
│    - Cannot use hooks or handle events                         │
│                                                                 │
│  • Client Components: marked with "use client"                 │
│    - Can use hooks (useState, useEffect, etc.)                │
│    - Can handle events (onClick, onChange, etc.)              │
│    - Cannot access server resources directly                   │
│                                                                 │
│  • Data flow: Server fetches → passes props → Client receives  │
│    Props must be serializable (no functions, classes)          │
│                                                                 │
│  • "use client" creates a boundary—everything imported         │
│    becomes client-side                                          │
│                                                                 │
│  • Only use "use client" when you need hooks or events        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Identify Components**: Open KindleCrafter's files. Which are Server Components? Which are Client Components? Why?

2. **Convert a Component**: Take a simple Server Component and add a click counter to it. What changes are needed?

3. **Data Flow**: Trace how the `kindleEmailConfigured` prop flows from `app/page.tsx` to `ConversionForm`.

---

## What's Next?

We've seen that Client Components can't directly access databases. How do we perform server-side operations from client-side UI? In Chapter 10, we'll learn about Server Actions—functions that run on the server but can be called from the client.

→ Continue to [Chapter 10: Server Actions](./10-server-actions.md)
