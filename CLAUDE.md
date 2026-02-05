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
        Step 1-2: extractPodcastAudio                  Inngest Background Job
        - iTunes API → RSS feed                        (inngest/functions.ts)
        - Parse RSS → Audio URL                        - 5 steps
                    ↓                                   - 2 retries
        Step 3: transcribePodcast
        - Download audio
        - Gemini 2.5 Flash transcription
        - Format as Markdown
                    ↓
        Step 4: parseMarkdown → HTML
                    ↓
        Step 5: generateEpub → sendToKindle
```

### Key Directories

- `app/actions/` - Server Actions for conversion (`convert.ts`), podcast (`podcast.ts`), magazines (`magazines.ts`), and settings (`settings.ts`)
- `app/podcast/` - Podcast transcription UI
- `app/magazines/` - Magazine subscription UI
- `lib/` - Core utilities: `markdown.ts` (parsing), `epub.ts` (generation), `email.ts` (delivery), `podcast.ts` (Apple Podcasts → Audio + Gemini transcription), `modal.ts` (Modal.com client for Calibre)
- `inngest/` - Background job functions (`functions.ts`)
- `modal_calibre/` - Modal.com Python container for Calibre recipe execution
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

### Magazine Subscriptions (optional - enables magazine feature)
```env
MODAL_ENDPOINT_URL    # Modal.com endpoint URL (e.g., https://user--kindlecrafter-calibre-convert-recipe.modal.run)
MODAL_WEBHOOK_SECRET  # Webhook secret for Modal authentication
```

## Podcast Feature Architecture

### Processing Pipeline

1. **URL Submission**: User provides Apple Podcasts episode URL
2. **Pre-flight Validation**: Check Kindle email, email service, and Gemini API configuration
3. **Duration Check**: Pre-fetch metadata from iTunes API, reject episodes >60 minutes
4. **Job Queueing**: Send `podcast/transcribe.requested` event to Inngest
5. **Background Processing** (5 steps with 2 retries):
   - Extract audio URL from iTunes API + RSS feed
   - Download audio file (streams large files >20MB to Gemini Files API)
   - Transcribe with Gemini 2.5 Flash using custom Kindle-optimized prompt
   - Convert transcript Markdown → EPUB
   - Email to configured Kindle address

### Technical Constraints

- **Duration Limit**: 60 minutes max (enforced in `app/actions/podcast.ts`)
- **Apple Podcasts Only**: Uses iTunes API + RSS feed parsing
- **Recent Episodes**: iTunes API returns max 200 episodes
- **Processing Time**: ~2-4 minutes for typical 30-45 minute episodes
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

## Magazine Feature Architecture

### Data Flow

```
User uploads .recipe file → Store in DB (recipes table)
                                    ↓
                           Schedule stored (recipe_schedules table)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
           Hourly Scheduler                  "Run Now" button
           (magazineSchedulerJob)            (runRecipeNow action)
                    ↓                               ↓
                    └───────────────┬───────────────┘
                                    ↓
                          Queue magazine/recipe.run event
                                    ↓
                          Inngest Background Job
                          (runMagazineRecipeJob)
                                    ↓
                          Modal.com Container
                          - Calibre + xvfb
                          - ebook-convert recipe.recipe output.epub
                                    ↓
                          Return EPUB as base64
                                    ↓
                          sendToKindle (existing email flow)
```

### Database Schema

- **recipes**: Store recipe metadata and base64-encoded .recipe file content
- **recipe_schedules**: Cron expression, timezone, last/next run timestamps, run status

### Modal.com Container

The `modal_calibre/app.py` Python container:
- Debian-based image with Calibre installed
- Uses `QT_QPA_PLATFORM=offscreen` for headless Qt (no xvfb needed)
- 10-minute timeout, 2GB RAM for complex recipes
- Receives recipe content (base64) and returns EPUB (base64)
- Most recipes use Python's `mechanize` (default) which has no display dependencies

### Deployment

```bash
# Deploy Modal container
cd modal_calibre
modal secret create kindlecrafter-webhook-secret WEBHOOK_SECRET=<your-secret>
modal deploy app.py
```

### Recipe Sources

Calibre recipes are Python scripts that define how to fetch and format content:
- [Official Calibre recipes](https://github.com/kovidgoyal/calibre/tree/master/recipes)
- Support for paywalled content requires credentials (deferred feature)

## Vercel Deployment

The `next.config.ts` includes `serverExternalPackages: ["jsdom", "epub-gen-memory"]` for Vercel compatibility. These packages must run server-side only.

### Inngest Configuration

For podcast feature on Vercel:
1. Create Inngest account (free tier sufficient for personal use)
2. Configure webhook: `https://yourdomain.com/api/inngest`
3. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to Vercel environment variables
4. Inngest will poll `/api/inngest` route for job definitions
