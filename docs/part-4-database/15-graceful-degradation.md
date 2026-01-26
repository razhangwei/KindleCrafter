# Chapter 15: Graceful Degradation

## Learning Objectives

By the end of this chapter, you will:

- Understand the principle of graceful degradation
- Design features that work with missing dependencies
- Handle optional configurations elegantly
- Use the null-check pattern for optional services
- See how KindleCrafter works without a database

---

## What is Graceful Degradation?

Graceful degradation means your application continues to work—with reduced functionality—when optional services are unavailable:

```
┌─────────────────────────────────────────────────────────────────┐
│              FULL FUNCTIONALITY                                 │
│                                                                 │
│   ✅ Database configured → Save Kindle email to DB             │
│   ✅ Email service configured → Send EPUBs to Kindle           │
│   ✅ Gemini API configured → Transcribe podcasts               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│              GRACEFUL DEGRADATION                               │
│                                                                 │
│   ❌ No database → Show warning, still allow downloads         │
│   ❌ No email → Disable "Send to Kindle", keep downloads       │
│   ❌ No Gemini → Hide podcast feature entirely                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

The app doesn't crash—it adapts.

---

## Why It Matters

### For Development

```bash
# Developer can start immediately without setting up everything
npm run dev
# App works! (with reduced features)
```

No need to configure Supabase, email services, or API keys just to see the UI.

### For Personal Use

Not everyone needs every feature:
- Just want to download EPUBs locally? No database needed.
- Don't have a Kindle? Skip email configuration.
- Don't care about podcasts? Skip Gemini setup.

### For Robustness

If a service goes down temporarily, the app still works:
- Database unavailable? Downloads still work.
- Email service down? Downloads still work.

---

## The Null-Check Pattern

KindleCrafter's database connection returns `null` if not configured:

```typescript
// db/index.ts

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  // Return null if not configured
  if (!connectionString || connectionString.includes("[project-ref]")) {
    return null;
  }

  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export const db = createDb();
// db is type: Database | null
```

### Usage in Server Actions

```typescript
// app/actions/settings.ts

export async function getSettings() {
  // Early return if database unavailable
  if (!db) {
    return null;
  }

  try {
    const [userSettings] = await db.select().from(settings).limit(1);
    return userSettings || null;
  } catch {
    return null;
  }
}

export async function updateSettings(kindleEmail: string) {
  // Throw error for required operations
  if (!db) {
    throw new Error("Database not configured. Please set DATABASE_URL in .env.local");
  }

  // ... update logic
}
```

Key distinction:
- **Read operations**: Return `null` (soft fail)
- **Write operations**: Throw error (hard fail with message)

---

## Feature Detection in UI

The Server Component checks configuration and passes results to the Client:

```tsx
// app/page.tsx

export default async function HomePage() {
  // Check what's available
  const settings = await getSettings();
  const emailConfigured = await checkEmailConfigured();

  return (
    <div>
      {/* Show warning if database isn't configured */}
      {!settings?.kindleEmail && (
        <div className="bg-yellow-50 border-yellow-200 p-4 rounded">
          <Link href="/settings">Configure your Kindle email</Link>
          {" "}to enable sending EPUBs directly to your device.
        </div>
      )}

      {/* Pass configuration status to client component */}
      <ConversionForm
        kindleEmailConfigured={!!settings?.kindleEmail}
        emailServiceConfigured={emailConfigured}
      />
    </div>
  );
}
```

### Client Component Adapts

```tsx
// components/conversion-form.tsx

export function ConversionForm({
  kindleEmailConfigured,
  emailServiceConfigured,
}: ConversionFormProps) {
  // Derive what features are available
  const canSendToKindle = kindleEmailConfigured && emailServiceConfigured;

  return (
    <div>
      {/* Download always works */}
      <Button onClick={handleDownload}>
        Download EPUB
      </Button>

      {/* Send to Kindle conditionally enabled */}
      <Button
        onClick={handleSendToKindle}
        disabled={!canSendToKindle}
        title={!canSendToKindle ? "Configure Kindle email and email service first" : undefined}
      >
        Send to Kindle
      </Button>

      {/* Explain why it's disabled */}
      {!canSendToKindle && (
        <p className="text-sm text-muted-foreground">
          {!kindleEmailConfigured
            ? "Configure your Kindle email in Settings to enable sending."
            : "Email service not configured (RESEND_API_KEY, SENDER_EMAIL)."}
        </p>
      )}
    </div>
  );
}
```

---

## Email Service Detection

KindleCrafter supports two email providers with fallback:

```typescript
// lib/email.ts

export function isGmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function isResendConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.SENDER_EMAIL);
}

export function isEmailConfigured(): boolean {
  return isGmailConfigured() || isResendConfigured();
}

export async function sendToKindle(options: SendOptions): Promise<void> {
  // Try Gmail first (easier setup), then Resend
  if (isGmailConfigured()) {
    await sendViaGmail(options);
  } else if (isResendConfigured()) {
    await sendViaResend(options);
  } else {
    throw new Error(
      "Email not configured. Please set either GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY + SENDER_EMAIL"
    );
  }
}
```

### Priority Order

1. **Gmail**: Easier to set up (uses app password)
2. **Resend**: More professional (requires verified domain)
3. **Neither**: Throw helpful error

---

## Podcast Feature Detection

The podcast feature requires multiple services:

```typescript
// app/actions/podcast.ts

export async function checkPodcastConfigured() {
  const settings = await getSettings();

  return {
    kindleEmail: !!settings?.kindleEmail,
    emailService: isEmailConfigured(),
    gemini: !!process.env.GEMINI_API_KEY,
    inngest: !!(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY),
  };
}
```

### UI Adapts to Configuration

```tsx
// app/podcast/page.tsx

export default async function PodcastPage() {
  const config = await checkPodcastConfigured();

  return (
    <div>
      {!config.kindleEmail && (
        <Warning>Configure your Kindle email</Warning>
      )}

      <PodcastForm
        kindleEmailConfigured={config.kindleEmail}
        emailServiceConfigured={config.emailService}
        geminiConfigured={config.gemini}
      />
    </div>
  );
}
```

```tsx
// components/podcast-form.tsx

export function PodcastForm({ geminiConfigured, ... }) {
  if (!geminiConfigured) {
    return (
      <Card>
        <p>Podcast transcription requires a Gemini API key.</p>
        <p>Set GEMINI_API_KEY in your environment variables.</p>
      </Card>
    );
  }

  // Normal form UI
  return (
    <Card>
      {/* ... */}
    </Card>
  );
}
```

---

## The Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   CORE (always works)                                           │
│   ├── Markdown → EPUB conversion                                │
│   └── EPUB download                                             │
│                                                                 │
│   LEVEL 1: + DATABASE_URL                                       │
│   └── Save/load Kindle email setting                            │
│                                                                 │
│   LEVEL 2: + EMAIL (Gmail OR Resend)                            │
│   └── Send EPUBs to Kindle                                      │
│                                                                 │
│   LEVEL 3: + GEMINI_API_KEY + INNGEST                           │
│   └── Podcast transcription                                     │
│                                                                 │
│   LEVEL 4: + APP_PASSWORD + SESSION_SECRET                      │
│   └── Password protection                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Each level adds functionality, but lower levels always work.

---

## Error Messages That Help

When things fail, tell users exactly what to do:

```typescript
// ❌ Bad error message
throw new Error("Email failed");

// ✅ Good error message
throw new Error(
  "Email not configured. Please set either GMAIL_USER + GMAIL_APP_PASSWORD, " +
  "or RESEND_API_KEY + SENDER_EMAIL in .env.local"
);
```

```typescript
// ❌ Bad: Crash on missing config
const db = drizzle(postgres(process.env.DATABASE_URL!));  // Crashes if undefined

// ✅ Good: Handle missing config
if (!process.env.DATABASE_URL) {
  return null;  // Let the app continue without DB
}
```

---

## Patterns Summary

### Pattern 1: Optional Service Returns Null

```typescript
function createService() {
  if (!process.env.REQUIRED_CONFIG) {
    return null;
  }
  return new Service(process.env.REQUIRED_CONFIG);
}

export const service = createService();

// Usage
if (service) {
  await service.doSomething();
} else {
  // Handle missing service
}
```

### Pattern 2: Check Before Use

```typescript
export function isServiceConfigured(): boolean {
  return !!process.env.REQUIRED_CONFIG;
}

// In Server Action
if (!isServiceConfigured()) {
  return { success: false, error: "Service not configured" };
}
```

### Pattern 3: Feature Flags via Props

```tsx
// Server Component
const config = await checkConfiguration();
<ClientComponent featureEnabled={config.feature} />

// Client Component
if (!featureEnabled) {
  return <DisabledMessage />;
}
```

### Pattern 4: Fallback Chain

```typescript
if (isPrimaryConfigured()) {
  await usePrimary();
} else if (isSecondaryConfigured()) {
  await useSecondary();
} else {
  throw new Error("No provider configured");
}
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 15 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Graceful degradation: app works with reduced features       │
│    when optional services aren't configured                     │
│                                                                 │
│  • Null-check pattern: service returns null if not configured  │
│    export const db = createDb();  // Database | null           │
│                                                                 │
│  • Feature detection: check config, pass to UI                 │
│    const emailConfigured = await checkEmailConfigured()        │
│    <Form emailConfigured={emailConfigured} />                  │
│                                                                 │
│  • UI adapts: disable buttons, show explanations              │
│    disabled={!canSendToKindle}                                 │
│    {!configured && <p>Please configure...</p>}                 │
│                                                                 │
│  • Helpful errors: tell users exactly what to configure        │
│    "Set GMAIL_USER + GMAIL_APP_PASSWORD in .env.local"        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Remove Configuration**: Temporarily remove DATABASE_URL from `.env.local`. Does the app still work? What features are disabled?

2. **Add a New Feature Flag**: Imagine adding a "statistics" feature. How would you detect if it's configured and adapt the UI?

3. **Trace the Path**: Follow how `kindleEmailConfigured` flows from `getSettings()` through the Server Component to the Client Component.

---

## What's Next?

We've covered the database layer. In Part V, we'll explore advanced patterns: business logic separation, authentication, background jobs, and external API integration.

→ Continue to [Chapter 16: Business Logic Layer](../part-5-advanced/16-business-logic-layer.md)
