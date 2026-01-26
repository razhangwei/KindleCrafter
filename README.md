# KindleCrafter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Convert content to EPUB format and send it directly to your Kindle.

## What You Can Convert

### Markdown Files
- Upload `.md` files with full GitHub Flavored Markdown support
- Download EPUB instantly or send to Kindle
- Preserves code blocks, tables, and formatting

### Podcast Episodes
- Transcribe Apple Podcast episodes to readable text
- Automatic speaker detection and chapter segmentation
- Delivered directly to your Kindle

## Core Features

- **Send to Kindle** - Deliver EPUBs directly to your Kindle via email
- **Clean Typography** - Styled output with serif fonts, proper spacing, and responsive images
- **Privacy-Focused** - All processing happens on your server
- **GitHub Flavored Markdown** - Full support for GFM syntax

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=postgresql://...

# Email delivery (at least one required for Send to Kindle)
RESEND_API_KEY=re_...
SENDER_EMAIL=kindle@yourdomain.com

# Or use Gmail as fallback
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Podcast Transcription (Optional - required for podcast feature)
GEMINI_API_KEY=...

# Background Jobs (Optional - required for podcast feature)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Database Setup

```bash
npx drizzle-kit push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Converting Markdown Files
1. Navigate to the home page
2. Upload or drag-and-drop a `.md` file
3. Edit title and author metadata as needed
4. Choose **Download** for immediate EPUB, or **Send to Kindle** for email delivery

### Transcribing Podcasts
1. Navigate to **Podcast** in the header
2. Find an episode on [Apple Podcasts](https://podcasts.apple.com)
3. Copy the episode URL (must include `/id{podcast-id}?i={episode-id}`)
4. Paste and submit - transcript arrives on your Kindle in a few minutes

### Kindle Email Setup

1. Go to Settings and enter your Kindle email (ends with `@kindle.com`)
2. Add your sender email to your [Amazon Approved Personal Document Email List](https://www.amazon.com/hz/mycd/myx#/home/settings/payment)
3. Use "Send to Kindle" to deliver documents

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Conversion**: marked + epub-gen-memory
- **Email**: Resend / Gmail (nodemailer)
- **Transcription**: Google Gemini API
- **Background Jobs**: Inngest

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/razhangwei/KindleCrafter)

The project includes `serverExternalPackages` configuration for Vercel compatibility.

## License

MIT
