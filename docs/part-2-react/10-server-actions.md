# Chapter 10: Server Actions

## Learning Objectives

By the end of this chapter, you will:

- Understand what Server Actions are and why they exist
- Create Server Actions with the "use server" directive
- Call Server Actions from Client Components
- Handle form submissions with Server Actions
- Return data from Server Actions
- See how KindleCrafter uses Server Actions for conversions

---

## The Problem

Client Components can't directly access databases or server resources. But we need to:
- Save data when a user submits a form
- Update settings
- Trigger server-side processing

Before Server Actions, you'd create API routes:

```
Client Component → fetch("/api/convert") → API Route → Database
```

Server Actions simplify this:

```
Client Component → await convertToEpub() → Server function (directly)
```

---

## What Are Server Actions?

Server Actions are async functions that run on the server but can be called from the client:

```tsx
// app/actions/greet.ts
"use server";

export async function greet(name: string) {
  // This runs on the server
  console.log("Server log:", name);  // Appears in terminal, not browser
  return `Hello, ${name}!`;
}
```

```tsx
// components/greeting.tsx
"use client";

import { greet } from "@/app/actions/greet";

export function Greeting() {
  const handleClick = async () => {
    // Call server function from client
    const message = await greet("Alice");
    alert(message);  // "Hello, Alice!"
  };

  return <button onClick={handleClick}>Greet</button>;
}
```

When you call `greet("Alice")`:
1. Next.js automatically makes a network request to the server
2. The function runs on the server
3. The return value is sent back to the client
4. No API routes needed

---

## The "use server" Directive

### File-Level Server Actions

Mark an entire file as Server Actions:

```tsx
// app/actions/settings.ts
"use server";  // All exports are Server Actions

export async function getSettings() {
  // ...
}

export async function updateSettings(email: string) {
  // ...
}
```

### Inline Server Actions

Define actions inside Server Components:

```tsx
// app/page.tsx (Server Component)
export default function Page() {
  async function handleSubmit(formData: FormData) {
    "use server";  // This specific function is a Server Action
    const name = formData.get("name");
    await saveToDatabase(name);
  }

  return (
    <form action={handleSubmit}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Calling Server Actions

### From Event Handlers

```tsx
"use client";

import { updateSettings } from "@/app/actions/settings";

export function SettingsForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateSettings(newEmail);
    if (result.success) {
      toast.success("Settings saved!");
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### From Form Actions

```tsx
// Server Component
import { submitForm } from "@/app/actions/form";

export default function Page() {
  return (
    <form action={submitForm}>
      <input name="email" type="email" />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

```tsx
// app/actions/form.ts
"use server";

export async function submitForm(formData: FormData) {
  const email = formData.get("email") as string;
  await saveEmail(email);
}
```

---

## KindleCrafter's Server Actions

### Converting Markdown to EPUB

```tsx
// app/actions/convert.ts
"use server";

import { parseMarkdown, extractTitleFromFilename } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle, isEmailConfigured } from "@/lib/email";
import { getSettings } from "./settings";

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
  try {
    const title = input.title || extractTitleFromFilename(input.filename);
    const author = input.author || "KindleCrafter";

    // Parse markdown to HTML (server-side)
    const html = await parseMarkdown(input.markdown);

    // Generate EPUB (server-side)
    const epubBuffer = await generateEpub({ title, author, html });

    // Return base64-encoded EPUB
    return {
      success: true,
      message: "EPUB generated successfully",
      epubBase64: epubBuffer.toString("base64"),
      filename: `${title}.epub`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function convertAndSend(input: ConvertInput): Promise<ConvertResult> {
  // Get user's Kindle email from database
  const userSettings = await getSettings();

  if (!userSettings?.kindleEmail) {
    return { success: false, message: "Please configure your Kindle email first" };
  }

  if (!isEmailConfigured()) {
    return { success: false, message: "Email sending is not configured." };
  }

  try {
    const title = input.title || extractTitleFromFilename(input.filename);
    const author = input.author || "KindleCrafter";

    const html = await parseMarkdown(input.markdown);
    const epubBuffer = await generateEpub({ title, author, html });

    // Send email with EPUB attachment
    await sendToKindle({
      to: userSettings.kindleEmail,
      title,
      epubBuffer,
    });

    return {
      success: true,
      message: `"${title}" sent to your Kindle!`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
```

Key observations:

1. **"use server"**: Marks file as Server Actions
2. **TypeScript interfaces**: Define clear input/output contracts
3. **Server-only code**: Uses `parseMarkdown`, `generateEpub`, `sendToKindle`—all server libraries
4. **Error handling**: Returns structured error messages, never throws to client
5. **Database access**: `getSettings()` queries the database directly

### Calling from Client Component

```tsx
// components/conversion-form.tsx
"use client";

import { convertToEpub, convertAndSend } from "@/app/actions/convert";

export function ConversionForm({ ... }) {
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Call Server Action
      const result = await convertToEpub({
        markdown,
        filename: file.name,
        title: title || undefined,
        author: author || undefined,
      });

      if (result.success && result.epubBase64) {
        // Handle the result client-side
        downloadFile(result.epubBase64, result.filename);
        toast.success("EPUB downloaded!");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to generate EPUB");
    } finally {
      setIsLoading(false);
    }
  };

  return <button onClick={handleDownload}>Download</button>;
}
```

---

## Settings Server Actions

```tsx
// app/actions/settings.ts
"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  if (!db) {
    return null;  // Database not configured
  }

  try {
    const [userSettings] = await db.select().from(settings).limit(1);
    return userSettings || null;
  } catch {
    return null;
  }
}

export async function updateSettings(kindleEmail: string) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const existing = await getSettings();

  if (existing) {
    // Update existing record
    await db
      .update(settings)
      .set({ kindleEmail, updatedAt: new Date() })
      .where(eq(settings.id, existing.id));
  } else {
    // Create new record
    await db.insert(settings).values({ kindleEmail });
  }

  // Invalidate cached data
  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
```

Key pattern: **revalidatePath** tells Next.js to re-fetch data for those routes:

```tsx
revalidatePath("/");           // Re-render home page
revalidatePath("/settings");   // Re-render settings page
```

This ensures the UI reflects the updated data.

---

## Server Action Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
│                                                                 │
│  ConversionForm (Client Component)                             │
│    │                                                           │
│    │  1. User clicks "Download EPUB"                           │
│    │     ↓                                                     │
│    │  2. handleDownload() calls convertToEpub(input)           │
│    │     ↓                                                     │
│    │  3. Next.js serializes input, makes POST request          │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼ POST /__next_server_action
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                  │
│                                                                 │
│  4. convertToEpub(input) executes                              │
│     │                                                          │
│     ├── parseMarkdown(markdown) → HTML                         │
│     │                                                          │
│     ├── generateEpub({ title, author, html }) → Buffer         │
│     │                                                          │
│     └── return { success: true, epubBase64, filename }         │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼ Response with serialized result
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
│                                                                 │
│  5. result = await convertToEpub(...)                          │
│     │                                                          │
│     ├── if (result.success)                                    │
│     │     downloadFile(result.epubBase64)                      │
│     │     toast.success("Downloaded!")                         │
│     │                                                          │
│     └── else                                                    │
│           toast.error(result.message)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. Return Data, Don't Throw

```tsx
// ❌ Throwing errors makes client handling awkward
export async function saveData(data: Data) {
  if (!data.name) {
    throw new Error("Name is required");  // Client sees generic error
  }
}

// ✅ Return structured responses
export async function saveData(data: Data) {
  if (!data.name) {
    return { success: false, error: "Name is required" };
  }
  return { success: true, data: savedData };
}
```

### 2. Validate Input

```tsx
"use server";

export async function updateEmail(email: string) {
  // Validate on server (never trust client)
  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email" };
  }

  // Proceed with update
}
```

### 3. Use revalidatePath After Mutations

```tsx
export async function createPost(content: string) {
  await db.insert(posts).values({ content });

  // Tell Next.js to refresh this page's data
  revalidatePath("/posts");

  return { success: true };
}
```

### 4. Keep Actions Focused

```tsx
// ❌ Too many concerns
export async function handleForm(formData: FormData) {
  const email = formData.get("email");
  const name = formData.get("name");
  await updateEmail(email);
  await updateName(name);
  await sendWelcomeEmail(email);
  await logActivity(email, "signup");
  // ... 50 more lines
}

// ✅ Compose smaller actions
export async function updateUser(data: { email: string; name: string }) {
  await db.update(users).set(data).where(eq(users.id, currentUserId));
  revalidatePath("/profile");
  return { success: true };
}
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 10 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Server Actions are async functions marked with "use server"  │
│    They run on the server but can be called from the client    │
│                                                                 │
│  • Call like regular functions: const result = await action()   │
│    Next.js handles the network request automatically           │
│                                                                 │
│  • Can access databases, secrets, filesystem—all server things │
│                                                                 │
│  • Return structured responses: { success, data, error }       │
│    Don't throw errors to the client                            │
│                                                                 │
│  • Use revalidatePath() after mutations                        │
│    Tells Next.js to re-fetch data for those routes            │
│                                                                 │
│  • TypeScript interfaces define clear contracts                │
│    interface Input { ... }, interface Result { ... }           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Create a Server Action**: Build a simple "contact form" Server Action that logs the form data to the console and returns a success message.

2. **Add Validation**: Modify your action to validate that email is not empty and contains "@". Return appropriate error messages.

3. **Trace KindleCrafter**: Follow the path from clicking "Send to Kindle" through `convertAndSend` to `sendToKindle`. What happens at each step?

---

## What's Next?

We've covered the React and Next.js fundamentals. In Part III, we'll explore styling in detail—Tailwind CSS for utility-first styling and shadcn/ui for pre-built components.

→ Continue to [Chapter 11: Tailwind CSS v4](../part-3-styling/11-tailwind-css.md)
