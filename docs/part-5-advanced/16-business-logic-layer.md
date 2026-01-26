# Chapter 16: Business Logic Layer

## Learning Objectives

By the end of this chapter, you will:

- Understand separation of concerns in web applications
- Know how to organize business logic in the `lib/` directory
- Create focused, testable utility functions
- Build processing pipelines with composable functions
- See how KindleCrafter separates concerns

---

## Why Separate Business Logic?

Consider putting everything in Server Actions:

```typescript
// ❌ Everything in one place
export async function convertAndSend(input: ConvertInput) {
  // Parse markdown (50 lines of code)
  // Generate EPUB (50 lines of code)
  // Send email (50 lines of code)
  // Handle errors (30 lines of code)
}
```

Problems:
- **Hard to test**: Can't test markdown parsing without email sending
- **Hard to reuse**: Can't use markdown parsing elsewhere
- **Hard to read**: 180 lines of mixed concerns
- **Hard to maintain**: Changes to email affect the whole function

Better:

```typescript
// ✅ Separated concerns
import { parseMarkdown } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle } from "@/lib/email";

export async function convertAndSend(input: ConvertInput) {
  const html = await parseMarkdown(input.markdown);
  const epub = await generateEpub({ title, author, html });
  await sendToKindle({ to: email, title, epubBuffer: epub });
}
```

Each function does one thing. The Server Action orchestrates them.

---

## KindleCrafter's lib/ Structure

```
lib/
├── markdown.ts    # Markdown → HTML conversion
├── epub.ts        # HTML → EPUB generation
├── email.ts       # Email sending (Gmail/Resend)
├── podcast.ts     # Podcast extraction & transcription
├── auth.ts        # Session token management
├── inngest.ts     # Background job client
└── utils.ts       # General utilities (cn function)
```

Each file has a single responsibility:

| File | Responsibility | Dependencies |
|------|---------------|--------------|
| `markdown.ts` | Parse Markdown to HTML | `marked`, `sanitize-html` |
| `epub.ts` | Generate EPUB files | `epub-gen-memory` |
| `email.ts` | Send emails | `resend`, `nodemailer` |
| `podcast.ts` | Extract audio, transcribe | `@google/genai` |
| `auth.ts` | Session management | None (pure functions) |

---

## The Markdown Module

```typescript
// lib/markdown.ts

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export async function parseMarkdown(markdown: string): Promise<string> {
  // Configure markdown parser
  marked.setOptions({
    gfm: true,      // GitHub Flavored Markdown
    breaks: true,   // Convert \n to <br>
  });

  // Parse markdown to raw HTML
  const rawHtml = await marked.parse(markdown);

  // Sanitize to prevent XSS attacks
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1", "h2", "h3", "h4", "h5", "h6", "img", "pre", "code"
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "title", "target"],
      code: ["class"],
      pre: ["class"],
    },
  });

  return cleanHtml;
}

export function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")         // Remove .md extension
    .replace(/[-_]/g, " ")         // Replace dashes/underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase());  // Title case
}
```

### Key Principles

1. **Pure function**: Input markdown, output HTML. No side effects.
2. **Security**: Sanitizes HTML to prevent XSS attacks.
3. **Configurable**: marked options are set inside the function.
4. **Helper function**: `extractTitleFromFilename` is related but separate.

---

## The EPUB Module

```typescript
// lib/epub.ts

import epub from "epub-gen-memory";

interface EpubOptions {
  title: string;
  author: string;
  html: string;
}

export async function generateEpub({
  title,
  author,
  html,
}: EpubOptions): Promise<Buffer> {
  const options = {
    title,
    author,
    css: `
      body { font-family: serif; line-height: 1.6; }
      h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
      code { font-family: monospace; background: #f4f4f4; }
      pre { background: #f4f4f4; padding: 1em; }
      blockquote { border-left: 3px solid #ccc; padding-left: 1em; }
    `,
  };

  const content = [{ title, content: html }];

  const epubBuffer = await epub(options, content);
  return Buffer.from(epubBuffer);
}
```

### Key Principles

1. **Single responsibility**: HTML in, EPUB out.
2. **Typed interface**: `EpubOptions` defines the contract.
3. **Embedded CSS**: Reader-friendly styles baked in.
4. **Return type**: Returns `Buffer` for flexibility (save to file, send as email attachment, etc.)

---

## The Email Module

```typescript
// lib/email.ts

import { Resend } from "resend";
import nodemailer from "nodemailer";

// --- Configuration Detection ---

export function isGmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function isResendConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.SENDER_EMAIL);
}

export function isEmailConfigured(): boolean {
  return isGmailConfigured() || isResendConfigured();
}

// --- Email Sending ---

interface SendOptions {
  to: string;
  title: string;
  epubBuffer: Buffer;
}

async function sendViaGmail({ to, title, epubBuffer }: SendOptions): Promise<void> {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: title,
    text: `Your book "${title}" is attached.`,
    attachments: [{ filename: `${title}.epub`, content: epubBuffer }],
  });
}

async function sendViaResend({ to, title, epubBuffer }: SendOptions): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.SENDER_EMAIL!,
    to,
    subject: title,
    text: `Your book "${title}" is attached.`,
    attachments: [{ filename: `${title}.epub`, content: epubBuffer }],
  });
}

export async function sendToKindle(options: SendOptions): Promise<void> {
  // Priority: Gmail first (easier setup), then Resend
  if (isGmailConfigured()) {
    await sendViaGmail(options);
  } else if (isResendConfigured()) {
    await sendViaResend(options);
  } else {
    throw new Error("Email not configured");
  }
}
```

### Key Principles

1. **Multiple implementations**: Gmail and Resend support.
2. **Detection functions**: Check what's available.
3. **Fallback chain**: Prefer Gmail, fall back to Resend.
4. **Unified interface**: `sendToKindle` hides implementation details.

---

## The Pipeline Pattern

KindleCrafter's conversion is a pipeline:

```
Input → parseMarkdown → generateEpub → sendToKindle → Done
        (lib/markdown)  (lib/epub)    (lib/email)
```

In code:

```typescript
// app/actions/convert.ts

export async function convertAndSend(input: ConvertInput): Promise<ConvertResult> {
  const settings = await getSettings();

  // Step 1: Parse Markdown to HTML
  const html = await parseMarkdown(input.markdown);

  // Step 2: Generate EPUB from HTML
  const epubBuffer = await generateEpub({
    title: input.title || extractTitleFromFilename(input.filename),
    author: input.author || "KindleCrafter",
    html,
  });

  // Step 3: Send EPUB via email
  await sendToKindle({
    to: settings.kindleEmail,
    title: input.title,
    epubBuffer,
  });

  return { success: true, message: "Sent to Kindle!" };
}
```

Each step:
- Has clear input/output types
- Can be tested independently
- Can be reused in other contexts

---

## Error Handling Strategy

### In Library Functions

```typescript
// lib/markdown.ts - Let errors propagate
export async function parseMarkdown(markdown: string): Promise<string> {
  const rawHtml = await marked.parse(markdown);  // May throw
  const cleanHtml = sanitizeHtml(rawHtml);       // May throw
  return cleanHtml;
}
```

### In Server Actions

```typescript
// app/actions/convert.ts - Catch and wrap errors
export async function convertToEpub(input: ConvertInput): Promise<ConvertResult> {
  try {
    const html = await parseMarkdown(input.markdown);
    const epubBuffer = await generateEpub({ ... });

    return {
      success: true,
      epubBase64: epubBuffer.toString("base64"),
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
```

Library functions throw; Server Actions catch and return structured responses.

---

## Benefits of This Architecture

### 1. Testability

```typescript
// Easy to unit test
test("parseMarkdown converts headings", async () => {
  const html = await parseMarkdown("# Hello");
  expect(html).toContain("<h1>Hello</h1>");
});

test("generateEpub returns a Buffer", async () => {
  const epub = await generateEpub({ title: "Test", author: "Test", html: "<p>Hi</p>" });
  expect(Buffer.isBuffer(epub)).toBe(true);
});
```

### 2. Reusability

```typescript
// Used in Markdown flow
const html = await parseMarkdown(markdownContent);

// Used in Podcast flow
const html = await parseMarkdown(transcript);
```

### 3. Maintainability

Change email provider? Only edit `lib/email.ts`.
Change markdown parser? Only edit `lib/markdown.ts`.

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 16 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Separate concerns: each file has one responsibility         │
│    lib/markdown.ts, lib/epub.ts, lib/email.ts                  │
│                                                                 │
│  • Pure functions: input → output, no side effects             │
│    parseMarkdown(md) → html                                    │
│                                                                 │
│  • Pipeline pattern: compose functions for workflows           │
│    markdown → parseMarkdown → generateEpub → sendToKindle      │
│                                                                 │
│  • Error strategy: lib throws, actions catch                   │
│    Library: throw new Error(...)                               │
│    Action: try/catch → return { success: false, message }     │
│                                                                 │
│  • Server Actions orchestrate library functions                │
│    Keep actions thin; push logic to lib/                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Add a Module**: Create a `lib/validation.ts` that validates email addresses and URLs. Use it in a Server Action.

2. **Trace the Pipeline**: Follow a Markdown file from upload through conversion to download. Which functions touch it?

3. **Refactor**: If you were adding PDF support, where would that code go? How would you structure it?

---

## What's Next?

So far, KindleCrafter is open to anyone. In Chapter 17, we'll add password protection with middleware and authentication.

→ Continue to [Chapter 17: Middleware & Auth](./17-middleware-auth.md)
