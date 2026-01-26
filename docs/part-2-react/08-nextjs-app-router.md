# Chapter 8: Next.js App Router

## Learning Objectives

By the end of this chapter, you will:

- Understand what Next.js adds to React
- Know how file-based routing works
- Create layouts that wrap multiple pages
- Handle metadata for SEO
- Use Next.js's Link component for navigation
- See how KindleCrafter's pages are organized

---

## What is Next.js?

React is a library for building UI components. It doesn't provide:
- Routing (multiple pages)
- Server-side rendering
- Data fetching patterns
- Build optimization

Next.js is a **framework** built on React that provides all of these. It's the recommended way to build React applications.

### Key Next.js Features

| Feature | What It Does |
|---------|--------------|
| **File-based routing** | Create pages by adding files |
| **Server-side rendering** | Generate HTML on the server |
| **Server Components** | React components that run only on the server |
| **Server Actions** | Call server functions directly from components |
| **API Routes** | Build API endpoints alongside your app |
| **Optimized bundling** | Automatic code splitting, image optimization |

---

## File-Based Routing

In Next.js App Router, the file structure determines your URLs:

```
app/
├── page.tsx          → /
├── layout.tsx        → Layout for all pages
├── settings/
│   └── page.tsx      → /settings
├── podcast/
│   └── page.tsx      → /podcast
├── login/
│   └── page.tsx      → /login
└── api/
    └── inngest/
        └── route.ts  → /api/inngest
```

### Key File Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | The UI for a route (required to make it accessible) |
| `layout.tsx` | Shared UI that wraps child routes |
| `loading.tsx` | Loading UI for a route |
| `error.tsx` | Error UI for a route |
| `not-found.tsx` | 404 UI |
| `route.ts` | API endpoint (no UI) |

### The `page.tsx` File

Every accessible route needs a `page.tsx`:

```tsx
// app/settings/page.tsx
export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Configure your preferences here.</p>
    </div>
  );
}
```

This page is available at `/settings`.

---

## Layouts

Layouts provide shared UI that persists across route changes:

```tsx
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>Site Header</header>
        <main>{children}</main>
        <footer>Site Footer</footer>
      </body>
    </html>
  );
}
```

When you navigate from `/` to `/settings`:
- The layout stays mounted (header/footer don't re-render)
- Only the `{children}` changes

### KindleCrafter's Root Layout

```tsx
// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LogoutButton } from "@/components/logout-button";
import { cookies } from "next/headers";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KindleCrafter",
  description: "Convert content to EPUB and send to your Kindle",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("kindle_crafter_session")?.value;
  const isPasswordProtected = !!process.env.APP_PASSWORD;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b">
          <nav className="container mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              KindleCrafter
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">Markdown</Link>
              <Link href="/podcast">Podcast</Link>
              <Link href="/settings">Settings</Link>
              {isAuthenticated && isPasswordProtected && <LogoutButton />}
            </div>
          </nav>
        </header>
        <main className="container mx-auto max-w-2xl px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
```

Key observations:

1. **Font Loading**: Next.js's `next/font` optimizes font loading
2. **Metadata**: Exports a `metadata` object for SEO
3. **Server-Side Data**: Uses `cookies()` to check authentication (this runs on the server)
4. **Persistent UI**: Header, navigation, and Toaster persist across pages
5. **`{children}`**: Each page's content is rendered here

### Nested Layouts

You can create layouts for subsections:

```
app/
├── layout.tsx          # Root layout (all pages)
├── page.tsx            # /
├── dashboard/
│   ├── layout.tsx      # Dashboard layout (dashboard pages only)
│   ├── page.tsx        # /dashboard
│   └── settings/
│       └── page.tsx    # /dashboard/settings
```

The `/dashboard/settings` page gets both layouts wrapped:

```
RootLayout
└── DashboardLayout
    └── DashboardSettingsPage
```

---

## Navigation with Link

Use Next.js's `Link` component for internal navigation:

```tsx
import Link from "next/link";

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  );
}
```

### Link vs Anchor Tag

```jsx
// ❌ Regular anchor - full page reload
<a href="/about">About</a>

// ✅ Next.js Link - client-side navigation
<Link href="/about">About</Link>
```

`Link` performs client-side navigation:
- No full page reload
- Shared layouts stay mounted
- Browser history works correctly
- Prefetches linked pages on hover

### Link with Dynamic Routes

```tsx
<Link href={`/posts/${post.id}`}>Read More</Link>
```

---

## Dynamic Routes

Create routes with dynamic segments using brackets:

```
app/
├── posts/
│   ├── page.tsx           # /posts
│   └── [id]/
│       └── page.tsx       # /posts/123, /posts/abc, etc.
```

```tsx
// app/posts/[id]/page.tsx
export default function PostPage({
  params,
}: {
  params: { id: string };
}) {
  return <h1>Post ID: {params.id}</h1>;
}
```

### Catch-All Routes

```
app/
├── docs/
│   └── [...slug]/
│       └── page.tsx       # /docs/a, /docs/a/b, /docs/a/b/c
```

```tsx
// app/docs/[...slug]/page.tsx
export default function DocsPage({
  params,
}: {
  params: { slug: string[] };
}) {
  // /docs/a/b/c → slug = ['a', 'b', 'c']
  return <h1>Docs: {params.slug.join(' / ')}</h1>;
}
```

---

## Metadata and SEO

Next.js provides built-in SEO support:

### Static Metadata

```tsx
// app/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | My App",
  description: "Welcome to my application",
};

export default function HomePage() {
  return <h1>Home</h1>;
}
```

### Dynamic Metadata

```tsx
// app/posts/[id]/page.tsx
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPost(params.id);

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default function PostPage({ params }: { params: { id: string } }) {
  // ...
}
```

### Common Metadata Options

```tsx
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description for search engines",
  keywords: ["keyword1", "keyword2"],
  authors: [{ name: "Author Name" }],
  openGraph: {
    title: "OG Title",
    description: "OG Description",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Twitter Title",
  },
};
```

---

## KindleCrafter Page Structure

Let's trace through how KindleCrafter's pages work:

### Home Page (/)

```tsx
// app/page.tsx

import { ConversionForm } from "@/components/conversion-form";
import { getSettings } from "@/app/actions/settings";
import { checkEmailConfigured } from "@/app/actions/convert";
import Link from "next/link";

export default async function HomePage() {
  // Server-side data fetching (runs on every request)
  const settings = await getSettings();
  const emailConfigured = await checkEmailConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Convert Markdown to EPUB</h1>
        <p className="text-muted-foreground mt-1">
          Upload a Markdown file, convert it to EPUB, and send it to your Kindle.
        </p>
      </div>

      {/* Conditional warning */}
      {!settings?.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <Link href="/settings" className="underline font-medium">
              Configure your Kindle email
            </Link>{" "}
            to enable sending EPUBs directly to your device.
          </p>
        </div>
      )}

      {/* Pass server data as props */}
      <ConversionForm
        kindleEmailConfigured={!!settings?.kindleEmail}
        emailServiceConfigured={emailConfigured}
      />
    </div>
  );
}
```

Key observations:

1. **async function**: Server Components can be async
2. **Data fetching**: Calls `getSettings()` directly—no API endpoint needed
3. **Conditional rendering**: Shows warning if email isn't configured
4. **Props**: Passes configuration status to client component

### Podcast Page (/podcast)

```tsx
// app/podcast/page.tsx

import { PodcastForm } from "@/components/podcast-form";
import { checkPodcastConfigured } from "@/app/actions/podcast";
import Link from "next/link";

export default async function PodcastPage() {
  const config = await checkPodcastConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Podcast to Kindle</h1>
        <p className="text-muted-foreground mt-1">
          Transcribe a podcast episode and send it to your Kindle.
        </p>
      </div>

      {!config.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <Link href="/settings" className="underline font-medium">
              Configure your Kindle email
            </Link>{" "}
            to enable sending transcripts to your device.
          </p>
        </div>
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

Same pattern: fetch data on server, pass to client component as props.

---

## Route Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       RootLayout                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ <header>                                                 │   │
│  │   KindleCrafter | Markdown | Podcast | Settings          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ <main>                                                   │   │
│  │                                                          │   │
│  │   ┌──────────────────────────────────────────────────┐   │   │
│  │   │                 {children}                        │   │   │
│  │   │                                                   │   │   │
│  │   │  Route: /         → HomePage (ConversionForm)    │   │   │
│  │   │  Route: /podcast  → PodcastPage (PodcastForm)    │   │   │
│  │   │  Route: /settings → SettingsPage (SettingsForm)  │   │   │
│  │   │  Route: /login    → LoginPage (LoginForm)        │   │   │
│  │   │                                                   │   │   │
│  │   └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  <Toaster />                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 8 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • Next.js adds routing, SSR, and optimization to React        │
│                                                                 │
│  • File-based routing: app/about/page.tsx → /about             │
│                                                                 │
│  • layout.tsx wraps pages, persists across navigation          │
│    Every page must have a page.tsx file                        │
│                                                                 │
│  • Link component for client-side navigation                   │
│    <Link href="/about">About</Link>                            │
│                                                                 │
│  • Dynamic routes with brackets: [id], [...slug]               │
│                                                                 │
│  • Metadata export for SEO                                      │
│    export const metadata: Metadata = { title: "..." }          │
│                                                                 │
│  • Server Components can fetch data directly                    │
│    export default async function Page() { ... }                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Create a New Page**: Add a `/help` page to an existing Next.js project. Include a layout with a sidebar if you have one.

2. **Dynamic Route**: Create a `/users/[id]` route that displays the user ID from the URL.

3. **Explore KindleCrafter**: Map out all the routes in KindleCrafter's `app/` directory. Which pages are server-rendered?

---

## What's Next?

We've mentioned "Server Components" and "Client Components" several times. In Chapter 9, we'll explain this distinction in detail—it's one of the most important concepts in modern Next.js development.

→ Continue to [Chapter 9: Server vs Client Components](./09-server-vs-client.md)
