# KindleCrafter

Convert Markdown files to EPUB format and send them directly to your Kindle.

## Features

- **Markdown to EPUB conversion** - Upload `.md` files and download as properly formatted EPUB
- **Send to Kindle** - Deliver EPUBs directly to your Kindle via email
- **GitHub Flavored Markdown** - Full support for GFM syntax
- **Clean typography** - Styled output with serif fonts, proper spacing, and responsive images

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

1. **Upload** - Drag and drop or select a Markdown file
2. **Edit metadata** - Adjust title and author if needed
3. **Download** - Get the EPUB file directly, or
4. **Send to Kindle** - Configure your Kindle email in Settings, then send

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

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kindle-crafter)

The project includes `serverExternalPackages` configuration for Vercel compatibility.

## License

MIT
