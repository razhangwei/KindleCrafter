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

#### Podcast/Video Transcription (Asynchronous)

```
Apple Podcasts URL  ──┐
                      ├──→ [PodcastForm] → submitPodcastJob (Server Action)
YouTube URL ──────────┘                           ↓
                                    Validate config & duration
                                            ↓
                                    Queue Inngest event
                                    (podcast/transcribe.requested)
                                            ↓
                    ┌───────────────────────┴───────────────────────┐
                    ↓                                               ↓
        Step 1: extractAudio                           Inngest Background Job
        - Apple: iTunes API → RSS → Audio URL          (inngest/functions.ts)
        - YouTube: ytdl-core → Audio stream            - 5 steps
                    ↓                                   - 2 retries
        Step 2: transcribePodcast
        - Download audio
        - Gemini 2.5 Flash transcription
        - Format as Markdown
                    ↓
        Step 3: parseMarkdown → HTML
                    ↓
        Step 4-5: generateEpub → sendToKindle
```

### Key Directories

- `app/actions/` - Server Actions for conversion (`convert.ts`), podcast (`podcast.ts`), and settings (`settings.ts`)
- `app/podcast/` - Podcast/video transcription UI
- `lib/` - Core utilities: `markdown.ts` (parsing), `epub.ts` (generation), `email.ts` (delivery), `podcast.ts` (Apple Podcasts/YouTube → Audio + Gemini transcription)
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

### Podcast/Video Transcription (optional - enables podcast feature)
```env
GEMINI_API_KEY      # Google AI Studio API key
INNGEST_EVENT_KEY   # Inngest event key
INNGEST_SIGNING_KEY # Inngest signing key
YOUTUBE_COOKIES     # (Optional) JSON array of YouTube cookies to bypass bot detection
```

### Security (optional)
```env
APP_PASSWORD        # Password protection for personal use
SESSION_SECRET      # Secret for session tokens (required if APP_PASSWORD is set)
```

## Podcast/Video Feature Architecture

### Supported Sources

- **Apple Podcasts**: `https://podcasts.apple.com/.../id{podcast-id}?i={episode-id}`
- **YouTube**: `https://youtube.com/watch?v=VIDEO_ID`, `https://youtu.be/VIDEO_ID`, shorts, embeds

### Processing Pipeline

1. **URL Submission**: User provides Apple Podcasts episode URL or YouTube video URL
2. **Pre-flight Validation**: Check Kindle email, email service, and Gemini API configuration
3. **Source Detection**: Automatically detect URL type and route to appropriate handler
4. **Duration Check**: Pre-fetch metadata, reject content >60 minutes
5. **Job Queueing**: Send `podcast/transcribe.requested` event to Inngest
6. **Background Processing** (5 steps with 2 retries):
   - Extract audio URL (Apple: iTunes API + RSS feed, YouTube: ytdl-core)
   - Download audio file (streams large files >20MB to Gemini Files API)
   - Transcribe with Gemini 2.5 Flash using custom Kindle-optimized prompt
   - Convert transcript Markdown → EPUB
   - Email to configured Kindle address

### Technical Constraints

- **Duration Limit**: 60 minutes max (enforced in `app/actions/podcast.ts`)
- **Apple Podcasts**: Uses iTunes API + RSS feed parsing (max 200 recent episodes)
- **YouTube**: Uses @distube/ytdl-core for audio extraction
  - May require `YOUTUBE_COOKIES` env var if bot detection blocks requests
  - Export cookies from browser extension as JSON array format
- **Processing Time**: ~2-4 minutes for typical 30-45 minute content
- **Gemini Model**: gemini-2.5-flash (supports audio input up to ~1 hour)

### Transcription Prompt Features

The custom Gemini prompt (in `lib/podcast.ts`) produces Kindle-optimized output:
- Detects topic changes and inserts chapter headings (## Markdown)
- Identifies speakers by name (or uses Host/Guest labels)
- Removes filler words, false starts, ads, and sponsor reads
- Formats as clean, magazine-style Markdown (not verbatim transcript)
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
