# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Frontend:** Next.js 15+ (App Router)
- **Backend:** Server Actions (collocated with frontend)
- **Database:** Supabase (Postgres) + Drizzle ORM
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Deployment:** Vercel
- **Language:** TypeScript (strict mode)
- **Background Jobs:** Inngest (for async processing)
- **AI/Transcription:** Google Gemini 2.5 Flash

## Development Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npx drizzle-kit generate   # Generate database migrations
npx drizzle-kit push       # Push schema changes to database
```

## Architecture

### Data Flows

KindleCrafter supports multiple input types with unified EPUB generation:

#### Markdown Conversion (Synchronous)

```
Markdown File → [ConversionForm] → convertMarkdown (Server Action)
                                          ↓
                                    parseMarkdown (lib/markdown.ts)
                                    - marked (GFM support)
                                    - sanitize-html
                                          ↓
                                    generateEpub (lib/epub.ts)
                                    - epub-gen-memory
                                          ↓
                          ┌───────────────┴───────────────┐
                          ↓                               ↓
                    Download (Base64)            Send to Kindle (email)
```

#### Podcast Transcription (Asynchronous)

```
Apple Podcast URL → [PodcastForm] → submitPodcastJob (Server Action)
                                            ↓
                                    Validate config & duration
                                            ↓
                                    Queue Inngest event
                                    (podcast/transcribe.requested)
                                            ↓
                    ┌───────────────────────┴───────────────────────┐
                    ↓                                               ↓
        Step 1: extractSource                            Inngest Background Job
        - Apple: iTunes API → RSS → Audio URL             (inngest/functions.ts)
        - YouTube: oEmbed + youtube-transcript captions    - 4 steps
                    ↓                                      - 2 retries
        Step 2: transcribe/reformat
        - Apple: Download audio → Gemini audio-to-text
        - YouTube: Gemini text-to-text caption reformat
                    ↓
        Step 3: parseMarkdown → generateEpub
                    ↓
        Step 4: sendToKindle
```

### Key Directories

- `app/actions/` - Server Actions for conversion (`convert.ts`), podcast (`podcast.ts`), and settings (`settings.ts`)
- `app/podcast/` - Podcast transcription UI
- `lib/` - Core utilities: `markdown.ts` (parsing), `epub.ts` (generation), `email.ts` (delivery), `podcast.ts` (Apple Podcasts audio + YouTube captions → Gemini transcription/reformatting)
- `inngest/` - Background job functions (`functions.ts`)
- `db/` - Drizzle ORM schema and connection
- `components/ui/` - shadcn/ui components

### Patterns

- **Server Actions**: All heavy processing (markdown parsing, EPUB generation, email) runs server-side
- **Graceful Degradation**: App works without database or email configuration (download-only mode)
- **Single-Record Settings**: Uses `limit(1)` pattern for user configuration
- **Email Priority**: Gmail is tried first (easier setup), then Resend as fallback
- **Async Job Pattern**: Long-running tasks (podcast transcription) use Inngest for background processing with retries
- **Pipeline Convergence**: Both input types converge at EPUB generation (parseMarkdown → generateEpub)
- **AI-Powered Formatting**: Gemini custom prompts produce Kindle-optimized transcripts (speaker detection, chapter headings, filler removal)

## Environment Variables

### Required
```env
DATABASE_URL        # Supabase PostgreSQL connection string
```

### Email Delivery (at least one required for "Send to Kindle")
```env
# Option 1: Resend
RESEND_API_KEY      # Resend API key
SENDER_EMAIL        # Verified sender email

# Option 2: Gmail
GMAIL_USER          # Gmail address
GMAIL_APP_PASSWORD  # Gmail app-specific password
```

### Podcast Transcription (optional - enables podcast feature)
```env
GEMINI_API_KEY      # Google AI Studio API key
INNGEST_EVENT_KEY   # Inngest event key
INNGEST_SIGNING_KEY # Inngest signing key
```

### Security (optional)
```env
APP_PASSWORD        # Password protection for personal use
SESSION_SECRET      # Secret for session tokens (required if APP_PASSWORD is set)
```

## Podcast Feature Architecture

### Processing Pipeline

1. **URL Submission**: User provides Apple Podcasts episode URL or YouTube video URL
2. **Pre-flight Validation**: Check Kindle email, email service, and Gemini API configuration
3. **Source Extraction & Duration Check**: Extract source data (audio URL or captions + metadata), reject >60 minutes
4. **Job Queueing**: Send `podcast/transcribe.requested` event to Inngest
5. **Background Processing** (4 steps with 2 retries):
   - Extract source via `extractSource()` (Apple: iTunes API + RSS → audio URL; YouTube: oEmbed + youtube-transcript → captions)
   - Transcribe/reformat (Apple: download audio → Gemini audio-to-text; YouTube: Gemini text-to-text caption reformatting)
   - Convert Markdown → EPUB
   - Email to configured Kindle address

### Technical Constraints

- **Duration Limit**: 60 minutes max (enforced in `app/actions/podcast.ts`)
- **Supported Sources**: Apple Podcasts (iTunes API + RSS feed) and YouTube (caption-based, no audio download)
- **YouTube Captions**: Requires auto-generated or manual captions; videos with captions disabled will error immediately
- **Recent Episodes**: iTunes API returns max 200 episodes (Apple Podcasts only)
- **Gemini Model**: gemini-2.5-flash (audio transcription for Apple, text reformatting for YouTube)

### Transcription/Reformatting Prompts

The custom Gemini prompts (in `lib/podcast.ts`) produce Kindle-optimized output:
- **Audio transcription** (Apple Podcasts): Transcribes audio directly with speaker detection, chapter headings, filler removal
- **Caption reformatting** (YouTube): Cleans up raw auto-generated captions — adds punctuation, fixes errors, structures into chapters
- Both produce the same output format: clean, magazine-style Markdown with ## sections and **Speaker:** labels
- No timestamps or [inaudible] markers

### Error Handling

- Pre-flight checks validate all required services before queueing
- Inngest provides 2 automatic retries with exponential backoff
- Graceful failures return user-friendly error messages
- Duration validation prevents wasting API credits on unsupported long episodes

## Vercel Deployment

The `next.config.ts` includes `serverExternalPackages: ["jsdom", "epub-gen-memory"]` for Vercel compatibility. These packages must run server-side only.

### Inngest Configuration

For podcast feature on Vercel:
1. Create Inngest account (free tier sufficient for personal use)
2. Configure webhook: `https://yourdomain.com/api/inngest`
3. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to Vercel environment variables
4. Inngest will poll `/api/inngest` route for job definitions
