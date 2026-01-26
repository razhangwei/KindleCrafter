# Chapter 2: HTML - The Structure

## Learning Objectives

By the end of this chapter, you will:

- Understand HTML as the structural foundation of web pages
- Know the difference between elements, tags, and attributes
- Recognize semantic HTML elements and why they matter
- Understand the document structure (`<html>`, `<head>`, `<body>`)
- Be able to read and write basic HTML forms
- Connect these concepts to KindleCrafter's JSX templates

---

## What is HTML?

HTML (HyperText Markup Language) is not a programming language—it's a markup language. It describes the *structure* of content, not behavior. When you write HTML, you're telling the browser "this is a heading," "this is a paragraph," "this is a link," and so on.

Here's the simplest possible HTML document:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
```

The browser reads this and constructs a visual representation. The heading appears large and bold, the paragraph appears as regular text. You didn't write any styling code—the browser has default styles for each element type.

---

## Elements, Tags, and Attributes

### Elements

An HTML element consists of an opening tag, content, and a closing tag:

```html
<p>This is a paragraph.</p>
└┬┘ └───────┬────────┘ └┬┘
 │          │           │
opening   content    closing
  tag                  tag
```

Some elements are "self-closing" (they have no content):

```html
<img src="photo.jpg" alt="A photo" />
<br />
<input type="text" />
```

### Tags

Tags are the angle-bracket delimiters:
- Opening tag: `<p>`
- Closing tag: `</p>`
- Self-closing tag: `<img />`

### Attributes

Attributes provide additional information about elements:

```html
<a href="https://example.com" target="_blank">Click me</a>
   └──────────┬───────────┘ └──────┬──────┘
         attribute            attribute
    (name="value")         (name="value")
```

Common attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `id` | Unique identifier | `<div id="main-content">` |
| `class` | CSS class name(s) | `<p class="intro highlight">` |
| `href` | Link destination | `<a href="/about">` |
| `src` | Resource source | `<img src="logo.png">` |
| `alt` | Alternative text | `<img alt="Company logo">` |
| `type` | Input type | `<input type="email">` |
| `name` | Form field name | `<input name="username">` |

---

## Document Structure

Every HTML document has this fundamental structure:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Metadata: title, styles, scripts, meta tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <!-- Visible content goes here -->
  </body>
</html>
```

### `<!DOCTYPE html>`
Tells the browser to use modern HTML5 standards. Always include this.

### `<html>`
The root element. The `lang` attribute helps screen readers and search engines.

### `<head>`
Contains metadata—information *about* the page, not displayed content:
- `<title>`: Browser tab title, search engine results
- `<meta>`: Character encoding, viewport settings, description
- `<link>`: External stylesheets
- `<script>`: JavaScript files (sometimes)

### `<body>`
Contains everything the user sees and interacts with.

---

## Semantic HTML

"Semantic" means "relating to meaning." Semantic HTML uses elements that describe their content's purpose, not just appearance.

### Non-Semantic (Avoid)
```html
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
  </div>
</div>
<div class="main">
  <div class="article">
    <div class="title">Article Title</div>
  </div>
</div>
```

### Semantic (Preferred)
```html
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
<main>
  <article>
    <h1>Article Title</h1>
  </article>
</main>
```

### Why Semantic HTML Matters

1. **Accessibility**: Screen readers understand `<nav>` is navigation and `<main>` is main content
2. **SEO**: Search engines understand page structure better
3. **Maintainability**: Code is self-documenting
4. **Styling**: CSS can target elements by type, not just classes

### Key Semantic Elements

```
┌────────────────────────────────────────────────────────────────┐
│                         <header>                                │
│    Site logo, navigation, search                               │
├────────────────────────────────────────────────────────────────┤
│  <nav>                                                          │
│    Navigation links                                             │
├────────────────────────────────────────────────────────────────┤
│                          <main>                                 │
│  ┌─────────────────────────────┬──────────────────────────┐    │
│  │         <article>           │        <aside>           │    │
│  │   Independent content       │  Related/sidebar         │    │
│  │   Blog post, news story     │  content                 │    │
│  │  ┌─────────────────────┐    │                          │    │
│  │  │     <section>       │    │                          │    │
│  │  │  Thematic grouping  │    │                          │    │
│  │  └─────────────────────┘    │                          │    │
│  └─────────────────────────────┴──────────────────────────┘    │
├────────────────────────────────────────────────────────────────┤
│                         <footer>                                │
│    Copyright, links, contact info                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Common HTML Elements

### Headings

Six levels, `<h1>` being the most important:

```html
<h1>Main Page Title</h1>      <!-- One per page, typically -->
<h2>Section Heading</h2>
<h3>Subsection</h3>
<h4>Sub-subsection</h4>
<h5>Minor heading</h5>
<h6>Smallest heading</h6>
```

### Text Content

```html
<p>A paragraph of text.</p>

<strong>Bold/important text</strong>
<em>Italicized/emphasized text</em>

<blockquote>
  A quoted passage from another source.
</blockquote>

<code>Inline code</code>

<pre>
  Preformatted text
  (preserves whitespace)
</pre>
```

### Lists

```html
<!-- Unordered (bullet) list -->
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>

<!-- Ordered (numbered) list -->
<ol>
  <li>Step one</li>
  <li>Step two</li>
</ol>
```

### Links

```html
<a href="/about">Internal link</a>
<a href="https://example.com">External link</a>
<a href="mailto:hello@example.com">Email link</a>
<a href="/file.pdf" download>Download link</a>
```

### Images

```html
<img src="photo.jpg" alt="Description for accessibility" />
```

Always include `alt` text. Screen readers read it aloud, and it displays if the image fails to load.

---

## HTML Forms

Forms collect user input. They're central to web applications—login forms, search boxes, settings pages.

```html
<form action="/submit" method="POST">
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required />

  <label for="password">Password:</label>
  <input type="password" id="password" name="password" required />

  <button type="submit">Log In</button>
</form>
```

### The `<form>` Element

| Attribute | Purpose |
|-----------|---------|
| `action` | URL to submit to |
| `method` | HTTP method (GET or POST) |

### The `<input>` Element

The `type` attribute changes the input's behavior:

| Type | Renders As | Example |
|------|------------|---------|
| `text` | Single-line text box | Username, title |
| `password` | Hidden-text box | Passwords |
| `email` | Email input with validation | Email addresses |
| `number` | Numeric input | Quantities, ages |
| `checkbox` | Checkable box | Agreements, options |
| `radio` | Single-select from group | Multiple choice |
| `file` | File picker | Uploads |
| `hidden` | Invisible field | IDs, tokens |
| `submit` | Submit button | Form submission |

### Labels

Always associate labels with inputs for accessibility:

```html
<!-- Method 1: for/id association -->
<label for="username">Username:</label>
<input id="username" name="username" />

<!-- Method 2: Wrapping -->
<label>
  Username:
  <input name="username" />
</label>
```

### Other Form Elements

```html
<!-- Multi-line text -->
<textarea name="bio" rows="4"></textarea>

<!-- Dropdown -->
<select name="country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>

<!-- Button (doesn't submit by default) -->
<button type="button" onclick="doSomething()">Click</button>
```

---

## HTML in KindleCrafter

In modern React applications, we don't write raw HTML files. We write **JSX**—a syntax that looks like HTML but lives inside JavaScript/TypeScript files.

Here's a section of KindleCrafter's layout file:

```tsx
// app/layout.tsx

<header className="border-b">
  <nav className="container mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
    <Link href="/" className="text-xl font-bold">
      KindleCrafter
    </Link>
    <div className="flex items-center gap-4">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Markdown
      </Link>
      <Link
        href="/podcast"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Podcast
      </Link>
      <Link
        href="/settings"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Settings
      </Link>
    </div>
  </nav>
</header>
```

Notice:
- **Semantic elements**: `<header>` and `<nav>` describe the content's purpose
- **`className` instead of `class`**: In JSX, `class` is a reserved word, so we use `className`
- **`Link` component**: This is a Next.js component that renders as `<a>` but handles navigation more efficiently
- **Self-closing tags**: In JSX, tags like `<img>` must self-close: `<img />`

### A KindleCrafter Form

Here's the file upload component:

```tsx
// components/file-upload.tsx

<label className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
  <input
    type="file"
    accept=".md"
    onChange={handleFileInput}
    disabled={disabled}
    className="hidden"
  />
  <div className="space-y-2">
    <div className="text-4xl">📄</div>
    {selectedFile ? (
      <div>
        <p className="font-medium">{selectedFile.name}</p>
        <p className="text-sm text-muted-foreground">
          {(selectedFile.size / 1024).toFixed(1)} KB
        </p>
      </div>
    ) : (
      <div>
        <p className="font-medium">
          Drop a Markdown file here or click to select
        </p>
        <p className="text-sm text-muted-foreground">
          Supports .md files up to 4MB
        </p>
      </div>
    )}
  </div>
</label>
```

Key observations:
- **Hidden file input**: The actual `<input type="file">` is hidden with `className="hidden"`. Clicking the visible content triggers it because it's wrapped in a `<label>`.
- **Conditional rendering**: `{selectedFile ? (...) : (...)}` shows different content based on state.
- **Event handlers**: `onChange={handleFileInput}` runs JavaScript when the input changes.

This pattern—hiding the native file input and creating a custom design—is common because native file inputs are difficult to style.

---

## The DOM

When the browser parses HTML, it creates the **DOM** (Document Object Model)—a tree structure representing the document:

```
                    document
                       │
                     <html>
                    /      \
               <head>      <body>
                 │           │
              <title>      <div>
                 │         /   \
            "Settings"  <h1>   <p>
                         │      │
                   "Settings"  "..."
```

JavaScript can read and modify this tree. When you click a button that shows a modal, JavaScript is modifying the DOM.

We'll explore DOM manipulation in Chapter 4 (JavaScript) and see how React abstracts this in Chapter 6.

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 2 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • HTML describes structure, not appearance or behavior         │
│                                                                 │
│  • Elements = opening tag + content + closing tag               │
│    <p>This is a paragraph.</p>                                 │
│                                                                 │
│  • Attributes provide additional info: <a href="...">          │
│                                                                 │
│  • Document structure: <html> → <head> + <body>                │
│                                                                 │
│  • Semantic HTML: use <header>, <nav>, <main>, <article>,      │
│    not just <div> everywhere                                    │
│                                                                 │
│  • Forms: <form>, <input>, <label>, <button>, <select>         │
│                                                                 │
│  • JSX is HTML-like syntax in JavaScript/TypeScript files       │
│    (className instead of class, self-closing tags required)    │
│                                                                 │
│  • The DOM is the browser's in-memory representation of HTML    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Inspect Elements**: Open any website, right-click on different parts, and select "Inspect." Explore the HTML structure. Can you identify semantic elements like `<header>`, `<nav>`, `<main>`?

2. **Build a Form**: Write an HTML file with a form that has:
   - Text input for name
   - Email input
   - Dropdown for country
   - Checkbox for terms agreement
   - Submit button
   Open it in a browser. What happens when you submit?

3. **Compare with KindleCrafter**: Open `components/file-upload.tsx` in your editor. Identify the HTML elements being used. How is the file input styled if it's hidden?

---

## What's Next?

HTML provides structure, but it doesn't control how things look. In Chapter 3, we'll explore CSS—the language for styling web pages.

→ Continue to [Chapter 3: CSS - Styling](./03-css-styling.md)
