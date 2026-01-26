# Chapter 18: Background Jobs

## Learning Objectives

By the end of this chapter, you will:

- Understand when to use background jobs vs synchronous processing
- Know how Inngest works for serverless background jobs
- Create step functions with retries and durability
- Send events to trigger background processing
- See how KindleCrafter processes podcasts asynchronously

---

## Why Background Jobs?

Podcast transcription takes 2-4 minutes. What happens during a synchronous request?

```
┌─────────────────────────────────────────────────────────────────┐
│                 SYNCHRONOUS (Bad for long tasks)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Transcribe" → Request starts                      │
│                              │                                  │
│                              ▼                                  │
│                         [2-4 minutes of processing]             │
│                              │                                  │
│  Browser shows spinner       │    ← User waits, gets impatient │
│  Connection might timeout    │    ← Server might kill request  │
│  User might close tab        │    ← Work lost                  │
│                              │                                  │
│                              ▼                                  │
│                         Response (if we're lucky)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 ASYNCHRONOUS (Better)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Transcribe" → Request starts                      │
│                              │                                  │
│                              ▼                                  │
│                         Queue job (100ms)                       │
│                              │                                  │
│  Response: "Processing!"     │    ← User gets immediate feedback│
│                              │                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Background (separate process):                                 │
│                              │                                  │
│                              ▼                                  │
│                         [2-4 minutes of processing]             │
│                              │                                  │
│                              ▼                                  │
│                         Send to Kindle                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What is Inngest?

Inngest is a serverless workflow engine that:
- Runs background jobs without managing servers
- Provides automatic retries on failure
- Breaks jobs into steps that checkpoint progress
- Works with serverless platforms like Vercel

### How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                         YOUR APP                                  │
│                                                                  │
│   Server Action                      API Route                   │
│   ┌────────────────┐                ┌────────────────┐          │
│   │ submitPodcast  │                │ /api/inngest   │          │
│   │     Job()      │                │                │          │
│   └───────┬────────┘                └───────┬────────┘          │
│           │                                 ↑                    │
│           │ 1. Send event                   │ 3. Poll for jobs  │
│           ▼                                 │                    │
└───────────┼─────────────────────────────────┼────────────────────┘
            │                                 │
            ▼                                 │
┌───────────────────────────────────────────────────────────────────┐
│                         INNGEST                                    │
│                                                                   │
│   2. Receives event, queues job                                   │
│      ↓                                                            │
│   Calls /api/inngest to run each step                             │
│      ↓                                                            │
│   Handles retries, checkpoints, failures                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Setting Up Inngest

### 1. Create the Client

```typescript
// lib/inngest.ts

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "kindlecrafter",
});
```

### 2. Create the API Route

```typescript
// app/api/inngest/route.ts

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { transcribePodcastJob } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [transcribePodcastJob],
});
```

### 3. Define the Function

```typescript
// inngest/functions.ts

import { inngest } from "@/lib/inngest";
import { extractPodcastAudio, transcribePodcast } from "@/lib/podcast";
import { parseMarkdown } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle } from "@/lib/email";

export const transcribePodcastJob = inngest.createFunction(
  {
    id: "transcribe-podcast",
    retries: 2,  // Retry failed steps twice
  },
  { event: "podcast/transcribe.requested" },  // Trigger event
  async ({ event, step }) => {
    const { podcastUrl, kindleEmail } = event.data;

    // Step 1: Extract audio URL
    const { audioUrl, metadata } = await step.run("extract-audio", async () => {
      return extractPodcastAudio(podcastUrl);
    });

    // Step 2: Transcribe with Gemini
    const markdown = await step.run("transcribe", async () => {
      return transcribePodcast(audioUrl, metadata);
    });

    // Step 3: Generate EPUB
    const epubBase64 = await step.run("generate-epub", async () => {
      const html = await parseMarkdown(markdown);
      const epubBuffer = await generateEpub({
        title: metadata.title,
        author: metadata.podcastName,
        html,
      });
      return epubBuffer.toString("base64");
    });

    // Step 4: Send to Kindle
    await step.run("send-to-kindle", async () => {
      const epubBuffer = Buffer.from(epubBase64, "base64");
      await sendToKindle({
        to: kindleEmail,
        title: metadata.title,
        epubBuffer,
      });
    });

    return { success: true, title: metadata.title };
  }
);
```

---

## Step Functions

The `step.run()` pattern provides durability:

```typescript
await step.run("step-name", async () => {
  // This code runs in isolation
  // If it fails, only this step is retried
  // If it succeeds, the result is checkpointed
  return result;
});
```

### Why Steps Matter

```
Without steps:
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Extract (10 sec) ✓                                     │
│  Step 2: Transcribe (3 min) ✓                                   │
│  Step 3: Generate EPUB (5 sec) ✓                                │
│  Step 4: Send Email ✗ FAILS!                                   │
│                                                                 │
│  Entire job retries from beginning... 3+ minutes wasted        │
└─────────────────────────────────────────────────────────────────┘

With steps:
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Extract (10 sec) ✓ [checkpointed]                     │
│  Step 2: Transcribe (3 min) ✓ [checkpointed]                   │
│  Step 3: Generate EPUB (5 sec) ✓ [checkpointed]                │
│  Step 4: Send Email ✗ FAILS!                                   │
│                                                                 │
│  Only Step 4 retries! Previous work preserved.                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sending Events

### From a Server Action

```typescript
// app/actions/podcast.ts
"use server";

import { inngest } from "@/lib/inngest";
import { getSettings } from "./settings";
import { extractPodcastAudio, isGeminiConfigured } from "@/lib/podcast";
import { isEmailConfigured } from "@/lib/email";

export async function submitPodcastJob(podcastUrl: string) {
  // Pre-flight checks
  const settings = await getSettings();

  if (!settings?.kindleEmail) {
    return { success: false, error: "Configure your Kindle email first" };
  }

  if (!isEmailConfigured()) {
    return { success: false, error: "Email service not configured" };
  }

  if (!isGeminiConfigured()) {
    return { success: false, error: "Gemini API key not configured" };
  }

  // Validate URL format
  try {
    const { metadata } = await extractPodcastAudio(podcastUrl);

    // Check duration (60 min max)
    if (metadata.durationSeconds && metadata.durationSeconds > 3600) {
      return {
        success: false,
        error: "Episode too long (max 60 minutes)",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Invalid podcast URL: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }

  // Send event to Inngest
  await inngest.send({
    name: "podcast/transcribe.requested",
    data: {
      podcastUrl,
      kindleEmail: settings.kindleEmail,
    },
  });

  return {
    success: true,
    message: "Transcription started! Your Kindle will receive the transcript shortly.",
  };
}
```

### Event Structure

```typescript
await inngest.send({
  name: "podcast/transcribe.requested",  // Event type
  data: {                                 // Payload
    podcastUrl: "https://podcasts.apple.com/...",
    kindleEmail: "user@kindle.com",
  },
});
```

---

## Retry Configuration

```typescript
inngest.createFunction(
  {
    id: "transcribe-podcast",
    retries: 2,  // Retry each step up to 2 times
  },
  { event: "podcast/transcribe.requested" },
  async ({ event, step }) => {
    // ...
  }
);
```

Retries use exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After ~30 seconds
- Attempt 3: After ~1 minute

---

## Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                PODCAST TRANSCRIPTION PIPELINE                    │
└─────────────────────────────────────────────────────────────────┘

User submits URL
        │
        ▼
┌───────────────────────┐
│ submitPodcastJob()    │
│ - Validate config     │
│ - Check duration      │
│ - Send Inngest event  │
└───────────┬───────────┘
            │
            ▼  event: podcast/transcribe.requested
┌───────────────────────────────────────────────────────────────┐
│                    INNGEST BACKGROUND JOB                      │
│                                                                │
│   Step 1: extract-audio                                        │
│   ├── Parse Apple Podcast URL                                  │
│   ├── Query iTunes API for RSS feed                            │
│   └── Find audio URL in RSS                                    │
│           │                                                    │
│           ▼                                                    │
│   Step 2: transcribe                                           │
│   ├── Download audio file                                      │
│   ├── Send to Gemini API                                       │
│   └── Receive formatted Markdown                               │
│           │                                                    │
│           ▼                                                    │
│   Step 3: generate-epub                                        │
│   ├── Parse Markdown to HTML                                   │
│   └── Generate EPUB file                                       │
│           │                                                    │
│           ▼                                                    │
│   Step 4: send-to-kindle                                       │
│   └── Email EPUB to Kindle address                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
            │
            ▼
     📚 Transcript on Kindle!
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 18 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Background jobs for long-running tasks (>30 seconds)        │
│    User gets immediate response, job runs separately           │
│                                                                 │
│  • Inngest: serverless job queue with retries                  │
│    inngest.send() → triggers function                          │
│    inngest.createFunction() → defines handler                  │
│                                                                 │
│  • step.run(): durable steps with checkpoints                  │
│    If step fails, only that step retries                       │
│    Previous step results are preserved                          │
│                                                                 │
│  • Pre-flight validation in Server Action                       │
│    Check config, validate input before queueing                │
│                                                                 │
│  • Event-driven: "podcast/transcribe.requested"                │
│    Decouples triggering from processing                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Set Up Inngest**: Create an Inngest account and configure the environment variables. Test the podcast transcription flow.

2. **Add Logging**: Add `console.log` statements to each step. Where do these logs appear? (Hint: Inngest dashboard)

3. **Simulate Failure**: Throw an error in one step. How does Inngest handle the retry?

---

## What's Next?

The podcast feature integrates with iTunes API, RSS feeds, and Google Gemini. In Chapter 19, we'll explore external API integration in depth.

→ Continue to [Chapter 19: External APIs & AI](./19-external-apis.md)
