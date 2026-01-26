# Chapter 21: Deploying to Vercel

## Learning Objectives

By the end of this chapter, you will:

- Understand what Vercel provides for Next.js apps
- Deploy a Next.js application to production
- Configure environment variables in Vercel
- Set up custom domains
- Configure server-side dependencies
- Understand serverless function considerations

---

## What is Vercel?

Vercel is the company behind Next.js and provides optimized hosting for Next.js applications:

| Feature | What It Does |
|---------|--------------|
| **Git Integration** | Automatic deploys on push |
| **Edge Network** | Global CDN for fast loading |
| **Serverless Functions** | Server-side code without managing servers |
| **Preview Deployments** | Every PR gets a unique URL |
| **Analytics** | Built-in performance monitoring |
| **Custom Domains** | Free HTTPS certificates |

---

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Vercel detects Next.js automatically

### 3. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL           = postgresql://...
GMAIL_USER             = your@gmail.com
GMAIL_APP_PASSWORD     = xxxx xxxx xxxx xxxx
GEMINI_API_KEY         = AIzaSy...
INNGEST_EVENT_KEY      = ...
INNGEST_SIGNING_KEY    = ...
APP_PASSWORD           = ...
SESSION_SECRET         = ...
```

Select which environments each variable applies to:
- **Production**: Live site
- **Preview**: PR preview deployments
- **Development**: Local (rarely used—use .env.local instead)

### 4. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies (`npm install`)
2. Build the project (`npm run build`)
3. Deploy to the edge network

---

## Next.js Configuration for Vercel

Some packages need special handling in serverless environments:

```typescript
// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages must run on server only
  serverExternalPackages: ["epub-gen-memory"],
};

export default nextConfig;
```

### Why serverExternalPackages?

Some npm packages:
- Use Node.js APIs not available in the browser
- Include native binaries
- Have large file sizes

`serverExternalPackages` tells Next.js to:
- Bundle these for server-side only
- Not try to include them in client JavaScript

---

## Serverless Considerations

Vercel runs your server-side code as serverless functions:

### Timeout Limits

| Plan | Limit |
|------|-------|
| Hobby (Free) | 10 seconds |
| Pro | 60 seconds |
| Enterprise | 900 seconds |

Podcast transcription takes 2-4 minutes—too long for serverless:

```
❌ Synchronous in serverless:
User clicks → Serverless function → 4 minutes → Timeout!

✅ With Inngest:
User clicks → Serverless function → Queue job (100ms) → Response
              Inngest runs job separately (no timeout)
```

That's why KindleCrafter uses Inngest for podcast transcription.

### Cold Starts

First request after idle may be slow (1-2 seconds) as the function "warms up."

Mitigation strategies:
- Keep functions small
- Use edge functions for latency-sensitive routes
- Accept occasional cold starts (usually fine for personal apps)

---

## Setting Up Inngest with Vercel

### 1. Create Inngest App

1. Go to [app.inngest.com](https://app.inngest.com)
2. Create new app
3. Get Event Key and Signing Key

### 2. Configure Webhook

In Inngest Dashboard → Your App → Manage:

```
Webhook URL: https://your-app.vercel.app/api/inngest
```

### 3. Add Environment Variables to Vercel

```
INNGEST_EVENT_KEY     = ...
INNGEST_SIGNING_KEY   = ...
```

### 4. Deploy

Inngest will automatically discover your functions via the `/api/inngest` route.

---

## Custom Domains

### Add Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., `kindlecrafter.com`)
3. Configure DNS at your registrar:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### HTTPS

Vercel automatically provisions SSL certificates. No configuration needed.

---

## Build Configuration

Vercel uses these defaults for Next.js:

```
Build Command:   npm run build
Output Directory: .next
Install Command:  npm install
```

Override in `vercel.json` if needed:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install"
}
```

---

## Deployment Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT FLOW                              │
└──────────────────────────────────────────────────────────────────┘

  Developer pushes to GitHub
          │
          ▼
  ┌───────────────────┐
  │ Vercel detects    │
  │ new commit        │
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐
  │ npm install       │
  │ npm run build     │
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐
  │ Deploy to CDN     │
  │ Update functions  │
  └─────────┬─────────┘
            │
            ▼
  Live at your-app.vercel.app
          │
          │ Preview deployments
          ▼
  PR commits → your-app-pr-123.vercel.app
```

---

## Production Checklist

Before going live:

```
[ ] Environment variables set in Vercel
[ ] Database accessible from Vercel (IP allowlist if needed)
[ ] Email service configured and tested
[ ] Inngest webhook configured
[ ] Custom domain added (optional)
[ ] Password protection enabled (APP_PASSWORD, SESSION_SECRET)
[ ] Test all features in production
```

---

## Debugging Production

### View Logs

Vercel Dashboard → Project → Logs

Shows server-side console.log output and errors.

### Deployment Issues

Check the deployment tab for build errors:
- Missing dependencies
- TypeScript errors
- Missing environment variables

### Runtime Errors

Check function logs for:
- Database connection failures
- API errors
- Timeout issues

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 21 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Vercel: optimized hosting for Next.js                       │
│    Git push → automatic deploy                                  │
│                                                                 │
│  • Environment variables: set in Vercel dashboard              │
│    Project → Settings → Environment Variables                  │
│                                                                 │
│  • serverExternalPackages: server-only dependencies            │
│    serverExternalPackages: ["epub-gen-memory"]                 │
│                                                                 │
│  • Serverless limits: 10-60 second timeout                     │
│    Use Inngest for long-running jobs                            │
│                                                                 │
│  • Inngest setup: webhook URL + environment keys               │
│    https://your-app.vercel.app/api/inngest                     │
│                                                                 │
│  • Custom domains: add in dashboard, configure DNS             │
│    HTTPS automatic                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Deploy to Vercel**: Fork KindleCrafter, connect to Vercel, and deploy with your own environment variables.

2. **Test Preview Deployments**: Create a branch, push a change, and find the preview URL.

3. **Check Logs**: After deployment, trigger an action and view the logs in Vercel dashboard.

---

## What's Next?

In our final chapter, we'll step back and review KindleCrafter's complete architecture—how all the pieces fit together.

→ Continue to [Chapter 22: System Design Recap](./22-system-design-recap.md)
