# Chapter 20: Environment Variables

## Learning Objectives

By the end of this chapter, you will:

- Understand why environment variables are used
- Know the difference between server and client variables
- Organize variables by feature and sensitivity
- Validate configuration at startup
- See how KindleCrafter manages its configuration

---

## What Are Environment Variables?

Environment variables are key-value pairs set outside your code:

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@host:5432/db"
GEMINI_API_KEY="AIzaSy..."
```

```typescript
// In your code
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.GEMINI_API_KEY;
```

### Why Use Them?

1. **Security**: Secrets aren't in your code (not committed to Git)
2. **Flexibility**: Different values for dev/staging/production
3. **Configuration**: Change behavior without changing code
4. **Feature flags**: Enable/disable features per environment

---

## Environment File Hierarchy

Next.js loads environment files in order:

```
.env                  # Default for all environments
.env.local            # Local overrides (not committed)
.env.development      # Only in development
.env.development.local
.env.production       # Only in production
.env.production.local
```

For local development, use `.env.local`:

```bash
# .env.local (gitignored)
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="AIzaSy..."
GMAIL_USER="your@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

---

## Server vs Client Variables

### Server-Only (Default)

```typescript
// Only accessible on the server
process.env.DATABASE_URL
process.env.GEMINI_API_KEY
```

These variables:
- Are available in Server Components, Server Actions, API routes
- Are **NOT** sent to the browser
- Keep secrets safe

### Client-Accessible (NEXT_PUBLIC_ prefix)

```typescript
// Accessible on client AND server
process.env.NEXT_PUBLIC_ANALYTICS_ID
```

These variables:
- Are embedded in the JavaScript bundle
- Are visible to anyone viewing your site
- Should **NEVER** contain secrets

```bash
# .env.local
DATABASE_URL="..."              # Server only
NEXT_PUBLIC_SITE_URL="..."      # Public, sent to client
```

---

## KindleCrafter's Variables

### Required Variables

```bash
# Database (required for settings persistence)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### Email Configuration (one required for Send to Kindle)

```bash
# Option 1: Gmail (easier setup)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# Option 2: Resend (more professional)
RESEND_API_KEY="re_..."
SENDER_EMAIL="noreply@yourdomain.com"
```

### Podcast Feature (optional)

```bash
# Google AI
GEMINI_API_KEY="AIzaSy..."

# Background Jobs
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

### Security (optional)

```bash
# Password protection
APP_PASSWORD="your-secret-password"
SESSION_SECRET="random-string-for-tokens"
```

---

## Variable Organization

Group variables by feature:

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://..."

# ============================================
# EMAIL (choose one)
# ============================================
# Gmail
GMAIL_USER="..."
GMAIL_APP_PASSWORD="..."

# OR Resend
# RESEND_API_KEY="..."
# SENDER_EMAIL="..."

# ============================================
# PODCAST TRANSCRIPTION
# ============================================
GEMINI_API_KEY="..."
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."

# ============================================
# SECURITY
# ============================================
APP_PASSWORD="..."
SESSION_SECRET="..."
```

---

## Configuration Detection

KindleCrafter checks what's configured at runtime:

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
```

```typescript
// lib/podcast.ts
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
```

```typescript
// db/index.ts
function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("[project-ref]")) {
    return null;  // Database not configured
  }

  // Create connection...
}
```

---

## Aggregated Configuration Check

For complex features, aggregate checks:

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

This tells the UI exactly what's available.

---

## Example .env.local Template

```bash
# Copy this to .env.local and fill in your values

# ============================================
# DATABASE (Supabase)
# ============================================
# Get from: Supabase Dashboard → Settings → Database → Connection String
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# ============================================
# EMAIL - Choose ONE option
# ============================================

# Option A: Gmail (Recommended for personal use)
# 1. Enable 2FA on your Google account
# 2. Go to: myaccount.google.com/apppasswords
# 3. Generate an "App Password" for "Mail"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# Option B: Resend (Recommended for custom domain)
# Get from: resend.com/api-keys
# RESEND_API_KEY="re_..."
# SENDER_EMAIL="noreply@yourdomain.com"

# ============================================
# PODCAST TRANSCRIPTION (Optional)
# ============================================
# Get from: aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSy..."

# Get from: app.inngest.com → Your App → Manage → Keys
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."

# ============================================
# SECURITY (Optional - for password protection)
# ============================================
# Set any password you want
# APP_PASSWORD="your-secure-password"
# SESSION_SECRET="any-random-string-32-chars-or-more"
```

---

## Validating Configuration

Fail fast with clear errors:

```typescript
// lib/email.ts

export async function sendToKindle(options: SendOptions): Promise<void> {
  if (isGmailConfigured()) {
    await sendViaGmail(options);
  } else if (isResendConfigured()) {
    await sendViaResend(options);
  } else {
    throw new Error(
      "Email not configured. Please set either " +
      "GMAIL_USER + GMAIL_APP_PASSWORD, or " +
      "RESEND_API_KEY + SENDER_EMAIL in .env.local"
    );
  }
}
```

```typescript
// lib/podcast.ts

export async function transcribePodcast(audioUrl: string, metadata: PodcastMetadata) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // ...proceed with transcription
}
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 20 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Environment variables: config outside code                  │
│    process.env.DATABASE_URL                                    │
│                                                                 │
│  • .env.local: local development (gitignored)                 │
│    Never commit secrets to version control                     │
│                                                                 │
│  • Server vs client:                                           │
│    Default = server only (secrets safe)                        │
│    NEXT_PUBLIC_ prefix = exposed to client                     │
│                                                                 │
│  • Detection functions: check what's configured                │
│    isEmailConfigured(), isGeminiConfigured()                   │
│                                                                 │
│  • Fail with helpful errors:                                   │
│    "Set GMAIL_USER + GMAIL_APP_PASSWORD in .env.local"        │
│                                                                 │
│  • Feature layers: core always works, features unlock          │
│    with more configuration                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Create .env.local**: Set up a `.env.local` file for KindleCrafter with at least DATABASE_URL.

2. **Test Detection**: Add a console.log to show which email provider is configured. Check the server logs.

3. **Add a Variable**: Create a new `NEXT_PUBLIC_APP_NAME` variable and display it in the header.

---

## What's Next?

Local development is working—now let's deploy to production. In Chapter 21, we'll deploy KindleCrafter to Vercel.

→ Continue to [Chapter 21: Deploying to Vercel](./21-deploying-to-vercel.md)
