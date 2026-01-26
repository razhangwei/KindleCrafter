# Chapter 1: How the Web Works

## Learning Objectives

By the end of this chapter, you will:

- Understand the HTTP request/response cycle
- Know what URLs, DNS, and status codes mean
- Grasp the client-server architecture of web applications
- See how your browser communicates with servers
- Understand the difference between static and dynamic content

---

## The Big Picture

When you type a URL into your browser and press Enter, a remarkable sequence of events unfolds. In less than a second, your computer reaches out across the internet, finds a server somewhere in the world, requests a document, receives it, and renders it on your screen. Understanding this process is fundamental to web development.

Let's trace through exactly what happens when you visit `https://kindlecrafter.example.com`.

---

## URLs: Addresses of the Web

A URL (Uniform Resource Locator) is simply an address. Just as your home has a street address, every resource on the web has a URL.

```
https://kindlecrafter.example.com/settings?tab=email#delivery
└─┬─┘ └─────────────┬─────────────┘└───┬───┘└───┬────┘ └───┬──┘
scheme           host                path    query    fragment
```

Let's break this down:

| Part | Example | Purpose |
|------|---------|---------|
| **Scheme** | `https` | Protocol to use (HTTP or HTTPS) |
| **Host** | `kindlecrafter.example.com` | Which server to contact |
| **Path** | `/settings` | Which resource on that server |
| **Query** | `?tab=email` | Additional parameters (key=value pairs) |
| **Fragment** | `#delivery` | Section within the page (client-side only) |

### HTTPS vs HTTP

HTTP (HyperText Transfer Protocol) is the language browsers and servers speak. HTTPS is HTTP with encryption—the 'S' stands for Secure. Today, virtually all websites use HTTPS to protect data in transit.

---

## DNS: The Internet's Phone Book

When you type `kindlecrafter.example.com`, your browser doesn't know where that server actually is. It needs an IP address—a numerical identifier like `104.21.15.210`.

This is where DNS (Domain Name System) comes in:

```
┌──────────┐                    ┌─────────────┐
│ Browser  │ ─── "Where is ──→  │ DNS Server  │
│          │     example.com?"  │             │
│          │ ←── 104.21.15.210 ─│             │
└──────────┘                    └─────────────┘
```

Your computer maintains a local cache of DNS lookups, and there are DNS servers at multiple levels (your router, your ISP, and root DNS servers). This distributed system translates human-readable domain names into machine-readable IP addresses billions of times per day.

---

## The HTTP Request

Once your browser knows the server's IP address, it opens a connection and sends an HTTP request. Here's what a simple request looks like:

```
GET /settings HTTP/1.1
Host: kindlecrafter.example.com
User-Agent: Mozilla/5.0 (Macintosh; ...)
Accept: text/html,application/xhtml+xml
Accept-Language: en-US,en
Connection: keep-alive
```

Let's break this down:

### Request Line
```
GET /settings HTTP/1.1
```
- **GET**: The HTTP method (what we want to do)
- **/settings**: The path (what resource we want)
- **HTTP/1.1**: The protocol version

### HTTP Methods

| Method | Purpose | Example Use Case |
|--------|---------|------------------|
| **GET** | Retrieve data | Loading a webpage |
| **POST** | Submit data | Submitting a form |
| **PUT** | Replace data | Updating a complete record |
| **PATCH** | Modify data | Updating part of a record |
| **DELETE** | Remove data | Deleting a resource |

For now, focus on GET (reading) and POST (writing). The others come into play when building APIs.

### Request Headers

Headers provide metadata about the request:

| Header | Purpose | Example Value |
|--------|---------|---------------|
| `Host` | Which website (servers can host multiple) | `kindlecrafter.example.com` |
| `User-Agent` | What browser/client is making the request | `Mozilla/5.0 ...` |
| `Accept` | What content types the client can handle | `text/html` |
| `Cookie` | Session data stored on the client | `session=abc123` |
| `Authorization` | Credentials for protected resources | `Bearer token123` |

### Request Body

For GET requests, there's typically no body. For POST requests, the body contains the data being submitted:

```
POST /api/convert HTTP/1.1
Host: kindlecrafter.example.com
Content-Type: application/json

{"markdown": "# Hello World", "filename": "hello.md"}
```

---

## The HTTP Response

The server processes the request and sends back a response:

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 1234
Set-Cookie: session=xyz789; HttpOnly

<!DOCTYPE html>
<html>
  <head><title>Settings</title></head>
  <body>...</body>
</html>
```

### Status Line
```
HTTP/1.1 200 OK
```
- **HTTP/1.1**: Protocol version
- **200**: Status code
- **OK**: Status text (human-readable description)

### HTTP Status Codes

Status codes are three-digit numbers that indicate what happened:

```
┌─────────────────────────────────────────────────────────────┐
│  1xx  │  Informational  │  Request received, continuing    │
├───────┼─────────────────┼───────────────────────────────────┤
│  2xx  │  Success        │  Request succeeded               │
│       │  200 OK         │  Standard success response       │
│       │  201 Created    │  Resource created (POST)         │
│       │  204 No Content │  Success, but no body to return  │
├───────┼─────────────────┼───────────────────────────────────┤
│  3xx  │  Redirection    │  Further action needed           │
│       │  301 Moved      │  Resource moved permanently      │
│       │  302 Found      │  Resource temporarily elsewhere  │
│       │  304 Not Modified│ Cached version is still valid   │
├───────┼─────────────────┼───────────────────────────────────┤
│  4xx  │  Client Error   │  Something wrong with request    │
│       │  400 Bad Request│  Malformed request               │
│       │  401 Unauthorized│ Authentication required         │
│       │  403 Forbidden  │  Not allowed to access           │
│       │  404 Not Found  │  Resource doesn't exist          │
│       │  429 Too Many   │  Rate limit exceeded             │
├───────┼─────────────────┼───────────────────────────────────┤
│  5xx  │  Server Error   │  Server failed to fulfill        │
│       │  500 Internal   │  Generic server error            │
│       │  502 Bad Gateway│  Upstream server failed          │
│       │  503 Unavailable│  Server temporarily down         │
└───────┴─────────────────┴───────────────────────────────────┘
```

You'll encounter these codes constantly in web development. The most common are:
- **200**: Everything worked
- **404**: Page not found
- **500**: Server error (check your logs!)

### Response Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `Content-Type` | What kind of data is in the body | `text/html`, `application/json` |
| `Content-Length` | Size of the response body in bytes | `1234` |
| `Set-Cookie` | Asks browser to store a cookie | `session=xyz; HttpOnly` |
| `Cache-Control` | How long to cache the response | `max-age=3600` |
| `Location` | Where to redirect (with 3xx codes) | `/new-location` |

### Response Body

The body contains the actual content—HTML, JSON, images, or whatever was requested.

---

## The Complete Request/Response Cycle

Here's the full picture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         THE INTERNET                                 │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                              ┌──────────────┐
    │  Browser │                              │    Server    │
    │ (Client) │                              │              │
    └────┬─────┘                              └───────┬──────┘
         │                                            │
         │  1. User types URL                         │
         │                                            │
         │  2. DNS lookup ─────────────────────────►  │
         │  ◄──────────────── IP address returned     │
         │                                            │
         │  3. Open TCP connection ─────────────────► │
         │  ◄──────────────── Connection established  │
         │                                            │
         │  4. Send HTTP request ───────────────────► │
         │     GET /settings HTTP/1.1                 │
         │     Host: example.com                      │
         │                                            │
         │                           5. Server processes
         │                              - Parse request
         │                              - Query database
         │                              - Generate HTML
         │                                            │
         │  ◄─────────────── 6. Send HTTP response    │
         │     HTTP/1.1 200 OK                        │
         │     Content-Type: text/html                │
         │     <html>...</html>                       │
         │                                            │
         │  7. Browser renders HTML                   │
         │     - Parse HTML                           │
         │     - Request CSS, JS, images              │
         │     - Execute JavaScript                   │
         │     - Display page                         │
         │                                            │
    ┌────┴─────┐                              ┌───────┴──────┐
    │ Rendered │                              │   Waiting    │
    │   Page   │                              │  for next    │
    └──────────┘                              │   request    │
                                              └──────────────┘
```

This happens every time you click a link, submit a form, or the page loads new data.

---

## Static vs Dynamic Content

### Static Content

Static content is pre-made files served directly from disk:
- HTML files
- CSS stylesheets
- JavaScript files
- Images, fonts, videos

The server simply reads the file and sends it. Nothing changes based on who's requesting it.

### Dynamic Content

Dynamic content is generated on each request based on:
- Who the user is
- What data is in the database
- What parameters were passed

In KindleCrafter, the home page is dynamic:

```typescript
// app/page.tsx - This runs on the server for each request
export default async function HomePage() {
  // Query the database for the current user's settings
  const settings = await getSettings();
  const emailConfigured = await checkEmailConfigured();

  // Generate different HTML based on the data
  return (
    <div>
      {!settings?.kindleEmail && (
        <div>Configure your Kindle email first</div>
      )}
      <ConversionForm
        kindleEmailConfigured={!!settings?.kindleEmail}
        emailServiceConfigured={emailConfigured}
      />
    </div>
  );
}
```

The HTML sent to the browser depends on whether the user has configured their Kindle email. This is dynamic content.

---

## Client-Server Architecture

Web applications follow a **client-server** model:

```
┌────────────────────────────────────────────────────────────────┐
│                          CLIENT                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                       Browser                            │   │
│  │  - Renders HTML/CSS                                      │   │
│  │  - Executes JavaScript                                   │   │
│  │  - Handles user interaction                              │   │
│  │  - Sends requests to server                              │   │
│  │  - Displays responses                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              │
                              │  HTTP Requests/Responses
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                          SERVER                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Web Server                            │   │
│  │  - Receives HTTP requests                                │   │
│  │  - Routes to appropriate handler                         │   │
│  │  - Queries databases                                     │   │
│  │  - Calls external APIs                                   │   │
│  │  - Generates responses                                   │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│         Database         File System    External APIs           │
└────────────────────────────────────────────────────────────────┘
```

### What Runs Where?

**Client (Browser):**
- HTML rendering
- CSS styling
- User interaction (clicks, typing)
- Form validation
- Animations
- Client-side JavaScript

**Server:**
- Database access
- Authentication logic
- Business rules
- File processing
- API calls to external services
- Secret/credential management

This separation matters for security. Anything running in the browser can be seen and modified by the user. Sensitive operations (like querying the database or sending emails) must happen on the server.

---

## Web Applications vs Web Sites

It's worth distinguishing between:

**Web Sites** (mostly static):
- Blogs, documentation, landing pages
- Content doesn't change per user
- Minimal interactivity

**Web Applications** (mostly dynamic):
- Gmail, GitHub, Figma, KindleCrafter
- Content changes based on user state
- Rich interactivity
- Often feel like desktop applications

Modern frameworks like Next.js blur this line, combining static and dynamic approaches for optimal performance.

---

## The Developer Tools

Every major browser includes Developer Tools (DevTools) for inspecting web pages. Press `F12` or right-click and select "Inspect" to open them.

### The Network Tab

The Network tab shows every HTTP request your browser makes:

```
┌────────────────────────────────────────────────────────────────┐
│ Name              │ Status │ Type     │ Size   │ Time         │
├───────────────────┼────────┼──────────┼────────┼──────────────┤
│ settings          │ 200    │ document │ 4.2 KB │ 120 ms       │
│ globals.css       │ 200    │ stylesheet│ 2.1 KB│ 45 ms        │
│ layout.js         │ 200    │ script   │ 156 KB │ 89 ms        │
│ favicon.ico       │ 200    │ image    │ 1.4 KB │ 23 ms        │
└────────────────────────────────────────────────────────────────┘
```

Click any request to see its headers, body, timing, and more. This is invaluable for debugging.

### Key DevTools Tabs

| Tab | Purpose |
|-----|---------|
| **Elements** | Inspect and modify HTML/CSS |
| **Console** | JavaScript logs and errors |
| **Network** | HTTP requests and responses |
| **Sources** | Debug JavaScript with breakpoints |
| **Application** | Cookies, storage, service workers |

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 1 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • URLs identify resources: scheme://host/path?query#fragment  │
│                                                                 │
│  • DNS translates domain names to IP addresses                  │
│                                                                 │
│  • HTTP is request/response: client asks, server answers        │
│                                                                 │
│  • HTTP methods: GET (read), POST (write), PUT, DELETE         │
│                                                                 │
│  • Status codes: 2xx success, 4xx client error, 5xx server     │
│                                                                 │
│  • Client = browser, Server = backend application               │
│                                                                 │
│  • Static content: same for everyone                            │
│  • Dynamic content: generated per request                       │
│                                                                 │
│  • DevTools Network tab shows all HTTP traffic                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Explore the Network Tab**: Open any website in your browser, open DevTools (F12), and go to the Network tab. Refresh the page and watch the requests appear. Click on the first request (the HTML document) and examine its headers.

2. **Find Status Codes**: Browse around a few websites. Can you intentionally trigger a 404 by visiting a non-existent page? Look for a 301/302 redirect.

3. **Inspect an API**: Visit a website that loads data dynamically (Twitter, Reddit, etc.). In the Network tab, filter by "XHR" or "Fetch" to see API requests. Examine the JSON responses.

---

## What's Next?

Now that you understand how browsers and servers communicate, let's look at what the server actually sends back. In Chapter 2, we'll explore HTML—the structural foundation of every web page.

→ Continue to [Chapter 2: HTML - The Structure](./02-html-structure.md)
