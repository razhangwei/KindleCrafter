# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

**Frontend:** Next.js 15+ (App Router)
**Backend:** Server Actions (collocated with frontend)
**Database:** Supabase (Postgres) + Drizzle ORM
**Styling:** Tailwind CSS v4 + shadcn/ui
**Deployment:** Vercel
**Language:** TypeScript (strict mode)

## Development Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npx drizzle-kit generate   # Generate database migrations
npx drizzle-kit push       # Push schema changes to database
```

## Architecture

### Data Flow

```
Markdown File → [ConversionForm] → Server Action
                                        ↓
                              parseMarkdown (marked + sanitize-html)
                                        ↓
                              generateEpub (epub-gen-memory)
                                        ↓
                    ┌───────────────────┴───────────────────┐
                    ↓                                       ↓
            Base64 → Download                    sendToKindle (email)
```

### Key Directories

- `app/actions/` - Server Actions for conversion (`convert.ts`) and settings (`settings.ts`)
- `lib/` - Core utilities: `markdown.ts` (parsing), `epub.ts` (generation), `email.ts` (delivery)
- `db/` - Drizzle ORM schema and connection
- `components/ui/` - shadcn/ui components

### Patterns

- **Server Actions**: All heavy processing (markdown parsing, EPUB generation, email) runs server-side
- **Graceful Degradation**: App works without database or email configuration (download-only mode)
- **Single-Record Settings**: Uses `limit(1)` pattern for user configuration
- **Email Priority**: Gmail is tried first (easier setup), then Resend as fallback

## Environment Variables

```
DATABASE_URL        # Supabase PostgreSQL connection string
RESEND_API_KEY      # Resend email service (optional)
SENDER_EMAIL        # Sender address for Resend (optional)
GMAIL_USER          # Gmail fallback (optional)
GMAIL_APP_PASSWORD  # Gmail app password (optional)
APP_PASSWORD        # Password protection for personal use (optional)
SESSION_SECRET      # Secret for session tokens (required if APP_PASSWORD is set)
```

## Vercel Deployment

The `next.config.ts` includes `serverExternalPackages: ["jsdom", "epub-gen-memory"]` for Vercel compatibility. These packages must run server-side only.
