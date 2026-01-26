# Chapter 17: Middleware & Auth

## Learning Objectives

By the end of this chapter, you will:

- Understand Next.js middleware and when it runs
- Implement route protection for personal applications
- Work with cookies for session management
- Create login/logout functionality
- See how KindleCrafter's password protection works

---

## What is Middleware?

Middleware runs *before* your routes are processed:

```
Request → Middleware → Route Handler → Response
                ↓
        Can redirect, modify request, or block
```

In Next.js, middleware intercepts every request and can:
- Redirect to login if not authenticated
- Add headers to responses
- Rewrite URLs
- Block requests based on conditions

---

## KindleCrafter's Middleware

```typescript
// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "kindle_crafter_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if password protection is enabled
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.next();  // No protection, allow all
  }

  // Allow access to login page and static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate session token
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = Buffer.from(sessionToken, "base64").toString("utf-8");
    const [timestamp, tokenSecret] = decoded.split(":");

    // Check secret matches
    if (tokenSecret !== secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if expired
    const tokenTime = parseInt(timestamp, 10);
    if (Date.now() - tokenTime >= SESSION_DURATION) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Which routes to run middleware on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │  Is APP_PASSWORD set?                  │
        └─────────────────┬─────────────────────┘
                          │
              ┌───────────┴───────────┐
              │ No                    │ Yes
              ▼                       ▼
        ┌──────────┐     ┌────────────────────────┐
        │ Allow    │     │ Is this /login, /_next,│
        │ request  │     │ /api, or static file?  │
        └──────────┘     └───────────┬────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │ Yes                   │ No
                         ▼                       ▼
                   ┌──────────┐     ┌────────────────────────┐
                   │ Allow    │     │ Valid session cookie?  │
                   │ request  │     └───────────┬────────────┘
                   └──────────┘                 │
                                    ┌───────────┴───────────┐
                                    │ Yes                   │ No
                                    ▼                       ▼
                              ┌──────────┐          ┌───────────────┐
                              │ Allow    │          │ Redirect to   │
                              │ request  │          │ /login        │
                              └──────────┘          └───────────────┘
```

---

## Session Token Design

KindleCrafter uses a simple token format:

```
Token = base64(timestamp:secret)
```

- **timestamp**: When the session was created
- **secret**: Matches SESSION_SECRET environment variable

```typescript
// lib/auth.ts

export function createSessionToken(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  const timestamp = Date.now().toString();
  const token = Buffer.from(`${timestamp}:${secret}`).toString("base64");
  return token;
}

export function validateSessionToken(token: string): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [timestamp, tokenSecret] = decoded.split(":");

    // Verify secret matches
    if (tokenSecret !== secret) return false;

    // Check expiration (7 days)
    const tokenTime = parseInt(timestamp, 10);
    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - tokenTime < SESSION_DURATION;
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return true;  // No password set = allow
  return password === appPassword;
}
```

### Security Notes

This is **simple password protection** for personal use, not production auth:
- Password stored in plain text in environment variable
- Token contains secret (simple but not cryptographically secure)
- Suitable for single-user personal apps

For multi-user apps, use proper authentication libraries like NextAuth.js or Clerk.

---

## Login Flow

### Login Page

```tsx
// app/login/page.tsx

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}
```

### Login Form

```tsx
// components/login-form.tsx
"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(password);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Invalid password");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
      <button type="submit">Login</button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

### Login Server Action

```typescript
// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { createSessionToken, verifyPassword } from "@/lib/auth";

export async function login(password: string) {
  if (!verifyPassword(password)) {
    return { success: false, error: "Invalid password" };
  }

  const token = createSessionToken();

  const cookieStore = await cookies();
  cookieStore.set("kindle_crafter_session", token, {
    httpOnly: true,      // Not accessible via JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",  // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60,  // 7 days
    path: "/",
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("kindle_crafter_session");
  return { success: true };
}
```

---

## Logout Flow

```tsx
// components/logout-button.tsx
"use client";

import { logout } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  );
}
```

### Conditional Rendering

```tsx
// app/layout.tsx

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("kindle_crafter_session")?.value;
  const isPasswordProtected = !!process.env.APP_PASSWORD;

  return (
    <html>
      <body>
        <nav>
          {/* ... other links ... */}
          {isAuthenticated && isPasswordProtected && <LogoutButton />}
        </nav>
        {children}
      </body>
    </html>
  );
}
```

---

## Cookie Security

```typescript
cookieStore.set("kindle_crafter_session", token, {
  httpOnly: true,      // JavaScript cannot access
  secure: true,        // Only sent over HTTPS
  sameSite: "strict",  // Only sent to same origin
  maxAge: 604800,      // Expires in 7 days
  path: "/",           // Available on all routes
});
```

| Flag | Purpose |
|------|---------|
| `httpOnly` | Prevents XSS attacks from stealing cookie |
| `secure` | Prevents cookie theft on non-HTTPS |
| `sameSite` | Prevents CSRF attacks |
| `maxAge` | Auto-expire after 7 days |

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 17 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Middleware runs before routes                                │
│    export function middleware(request: NextRequest)             │
│                                                                 │
│  • Route protection: check cookie, redirect if missing         │
│    request.cookies.get("session")                               │
│    NextResponse.redirect(new URL("/login", request.url))       │
│                                                                 │
│  • Session tokens: base64(timestamp:secret)                    │
│    Validate by checking secret and expiration                  │
│                                                                 │
│  • Login: verify password → create token → set cookie          │
│  • Logout: delete cookie                                        │
│                                                                 │
│  • Cookie security: httpOnly, secure, sameSite, maxAge         │
│                                                                 │
│  • Feature flag: if (!APP_PASSWORD) return NextResponse.next() │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Enable Protection**: Set APP_PASSWORD and SESSION_SECRET in `.env.local`. Verify you're redirected to login.

2. **Test Expiration**: Shorten SESSION_DURATION to 1 minute. Verify the session expires.

3. **Add Remember Me**: Modify the login to accept a "remember me" checkbox that extends the session duration.

---

## What's Next?

Podcast transcription takes minutes—too long for a synchronous request. In Chapter 18, we'll learn about background jobs with Inngest.

→ Continue to [Chapter 18: Background Jobs](./18-background-jobs.md)
