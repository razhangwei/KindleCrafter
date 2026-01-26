# Chapter 11: Tailwind CSS v4

## Learning Objectives

By the end of this chapter, you will:

- Understand the utility-first CSS approach
- Know Tailwind's spacing, color, and typography systems
- Use responsive design with breakpoint prefixes
- Work with Tailwind CSS v4's new features
- Understand the `cn()` utility function
- See how KindleCrafter styles its interface

---

## What is Tailwind CSS?

Tailwind is a **utility-first** CSS framework. Instead of writing custom CSS:

```css
/* Traditional CSS */
.card {
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

You apply utility classes directly in HTML:

```html
<!-- Tailwind CSS -->
<div class="p-6 bg-white rounded-lg shadow">
  Card content
</div>
```

Each class does one thing:
- `p-6` → `padding: 1.5rem` (24px)
- `bg-white` → `background-color: white`
- `rounded-lg` → `border-radius: 0.5rem` (8px)
- `shadow` → `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)`

---

## Why Utility-First?

### Traditional CSS Problems

1. **Naming is hard**: What do you call this style? `.card-wrapper-v2-updated`?
2. **CSS grows forever**: Old styles rarely get deleted
3. **Changes are scary**: Will changing `.button` break something else?
4. **Context switching**: Jump between HTML and CSS files

### Tailwind Benefits

1. **No naming**: Classes describe what they do
2. **No dead CSS**: Unused utilities are automatically removed
3. **Scoped changes**: Classes only affect the element they're on
4. **Everything in one place**: Style while writing markup

---

## The Spacing System

Tailwind uses a consistent spacing scale based on `0.25rem` (4px):

| Class | Value | Pixels (at 16px root) |
|-------|-------|----------------------|
| `p-0` | 0 | 0px |
| `p-1` | 0.25rem | 4px |
| `p-2` | 0.5rem | 8px |
| `p-3` | 0.75rem | 12px |
| `p-4` | 1rem | 16px |
| `p-5` | 1.25rem | 20px |
| `p-6` | 1.5rem | 24px |
| `p-8` | 2rem | 32px |
| `p-10` | 2.5rem | 40px |
| `p-12` | 3rem | 48px |
| `p-16` | 4rem | 64px |

### Spacing Properties

| Prefix | Property |
|--------|----------|
| `p-` | padding (all sides) |
| `px-` | padding left + right |
| `py-` | padding top + bottom |
| `pt-` / `pr-` / `pb-` / `pl-` | padding individual sides |
| `m-` | margin (all sides) |
| `mx-` / `my-` | margin horizontal / vertical |
| `mt-` / `mr-` / `mb-` / `ml-` | margin individual sides |
| `gap-` | gap in flexbox/grid |
| `space-x-` / `space-y-` | space between children |

### Examples

```html
<!-- Padding all sides: 16px -->
<div class="p-4">...</div>

<!-- Padding: 8px top/bottom, 16px left/right -->
<div class="py-2 px-4">...</div>

<!-- Margin top: 24px -->
<div class="mt-6">...</div>

<!-- Gap between flex children: 16px -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Colors

Tailwind provides a color palette with shades from 50 (lightest) to 950 (darkest):

```
50  100  200  300  400  500  600  700  800  900  950
└──────────────────────────────────────────────────┘
light                                          dark
```

### Color Properties

| Prefix | Property |
|--------|----------|
| `bg-` | background-color |
| `text-` | color (text) |
| `border-` | border-color |
| `ring-` | box-shadow ring |

### Examples

```html
<!-- Blue background -->
<div class="bg-blue-500">...</div>

<!-- Gray text -->
<p class="text-gray-600">...</p>

<!-- Red border -->
<div class="border border-red-500">...</div>

<!-- Green with opacity -->
<div class="bg-green-500/50">...</div>  <!-- 50% opacity -->
```

### Semantic Colors

KindleCrafter uses semantic color names:

```html
<button class="bg-primary text-primary-foreground">
  Primary Button
</button>

<p class="text-muted-foreground">
  Secondary text
</p>

<div class="bg-destructive text-white">
  Error message
</div>
```

These map to CSS variables (we'll see how in a moment).

---

## Typography

### Font Size

| Class | Size |
|-------|------|
| `text-xs` | 0.75rem (12px) |
| `text-sm` | 0.875rem (14px) |
| `text-base` | 1rem (16px) |
| `text-lg` | 1.125rem (18px) |
| `text-xl` | 1.25rem (20px) |
| `text-2xl` | 1.5rem (24px) |
| `text-3xl` | 1.875rem (30px) |

### Font Weight

| Class | Weight |
|-------|--------|
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

### Other Typography

```html
<!-- Alignment -->
<p class="text-left">Left</p>
<p class="text-center">Center</p>
<p class="text-right">Right</p>

<!-- Decoration -->
<a class="underline">Underlined link</a>
<span class="line-through">Strikethrough</span>

<!-- Line height -->
<p class="leading-relaxed">More line spacing</p>
<p class="leading-tight">Less line spacing</p>

<!-- Uppercase/lowercase -->
<span class="uppercase">uppercase text</span>
```

---

## Layout with Flexbox

```html
<!-- Basic flex container -->
<div class="flex">...</div>

<!-- Direction -->
<div class="flex flex-row">...</div>   <!-- horizontal (default) -->
<div class="flex flex-col">...</div>   <!-- vertical -->

<!-- Justify content (main axis) -->
<div class="flex justify-start">...</div>
<div class="flex justify-center">...</div>
<div class="flex justify-end">...</div>
<div class="flex justify-between">...</div>
<div class="flex justify-around">...</div>

<!-- Align items (cross axis) -->
<div class="flex items-start">...</div>
<div class="flex items-center">...</div>
<div class="flex items-end">...</div>
<div class="flex items-stretch">...</div>

<!-- Gap between items -->
<div class="flex gap-4">...</div>

<!-- Flex grow/shrink -->
<div class="flex-1">Takes remaining space</div>
<div class="flex-none">Fixed size</div>
```

### KindleCrafter's Navigation

```tsx
<nav className="flex items-center justify-between">
  <Link href="/" className="text-xl font-bold">
    KindleCrafter
  </Link>
  <div className="flex items-center gap-4">
    <Link href="/">Markdown</Link>
    <Link href="/podcast">Podcast</Link>
    <Link href="/settings">Settings</Link>
  </div>
</nav>
```

- `flex items-center justify-between`: Logo left, links right, vertically centered
- `flex items-center gap-4`: Links horizontally spaced 16px apart

---

## Responsive Design

Tailwind uses breakpoint prefixes:

| Prefix | Min Width | Typical Device |
|--------|-----------|----------------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

### Mobile-First Approach

```html
<!-- Mobile: stack, Tablet+: side by side -->
<div class="flex flex-col md:flex-row">
  <div>Sidebar</div>
  <div>Content</div>
</div>

<!-- Mobile: full width, Desktop: half width -->
<div class="w-full lg:w-1/2">
  ...
</div>

<!-- Mobile: small padding, Desktop: large padding -->
<div class="p-4 md:p-8 lg:p-12">
  ...
</div>

<!-- Hide on mobile, show on desktop -->
<div class="hidden lg:block">
  Only visible on large screens
</div>
```

---

## State Variants

Apply styles on specific states:

```html
<!-- Hover -->
<button class="bg-blue-500 hover:bg-blue-600">
  Hover me
</button>

<!-- Focus -->
<input class="border focus:border-blue-500 focus:ring-2">

<!-- Active (while clicking) -->
<button class="bg-blue-500 active:bg-blue-700">
  Click me
</button>

<!-- Disabled -->
<button class="bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
  Disabled
</button>

<!-- Group hover (parent hover affects child) -->
<div class="group">
  <span class="group-hover:text-blue-500">
    Changes when parent is hovered
  </span>
</div>
```

---

## Tailwind CSS v4 Features

### New CSS Import

```css
/* app/globals.css */
@import "tailwindcss";
```

That's it—no more `@tailwind base; @tailwind components; @tailwind utilities;`

### @theme Directive

Define design tokens that become Tailwind utilities:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --font-sans: var(--font-geist-sans);
}
```

Now you can use `bg-background`, `text-foreground`, `text-primary`, `font-sans`.

### KindleCrafter's Theme Setup

```css
/* app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  /* ... more color mappings ... */
}

:root {
  --background: oklch(1 0 0);           /* White */
  --foreground: oklch(0.145 0 0);       /* Near-black */
  --primary: oklch(0.205 0 0);
  --muted-foreground: oklch(0.556 0 0);
}

.dark {
  --background: oklch(0.145 0 0);       /* Near-black */
  --foreground: oklch(0.985 0 0);       /* Near-white */
  --primary: oklch(0.922 0 0);
  --muted-foreground: oklch(0.708 0 0);
}
```

This creates a theming system:
1. CSS variables define actual colors
2. `@theme` maps them to Tailwind utilities
3. `.dark` class switches all colors at once

---

## The cn() Utility

KindleCrafter uses `cn()` for conditional class merging:

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### What It Does

1. **clsx**: Joins classes, handles conditionals
2. **twMerge**: Resolves Tailwind conflicts intelligently

```tsx
import { cn } from "@/lib/utils";

// Conditional classes
cn("p-4", isActive && "bg-blue-500")
// → "p-4" or "p-4 bg-blue-500"

// Merge without conflicts
cn("p-2", "p-4")
// → "p-4" (not "p-2 p-4")

// Override base styles
cn("text-red-500", className)
// If className="text-blue-500", result is "text-blue-500"
```

### Real Usage

```tsx
// components/file-upload.tsx

<Card
  className={cn(
    "border-2 border-dashed p-8 text-center transition-colors",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "cursor-pointer hover:border-primary hover:bg-muted/50"
  )}
>
```

---

## Common Patterns

### Card Pattern

```tsx
<div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
  <h2 className="text-lg font-semibold">Card Title</h2>
  <p className="text-muted-foreground mt-2">Card description...</p>
</div>
```

### Button Pattern

```tsx
<button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
  Click me
</button>
```

### Input Pattern

```tsx
<input className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
```

### Container Pattern

```tsx
<div className="container mx-auto max-w-2xl px-4">
  Centered content with max width
</div>
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 11 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • Utility-first: small classes that do one thing             │
│    p-4, bg-white, text-sm, flex, rounded-lg                   │
│                                                                 │
│  • Spacing scale: p-1 (4px) to p-16 (64px)                    │
│    px-, py-, pt-, m-, mx-, gap-                                │
│                                                                 │
│  • Colors: bg-blue-500, text-gray-600, border-red-500         │
│    Semantic: bg-primary, text-muted-foreground                 │
│                                                                 │
│  • Responsive: sm:, md:, lg:, xl:, 2xl: prefixes              │
│    Mobile-first: base styles, then breakpoint overrides       │
│                                                                 │
│  • States: hover:, focus:, active:, disabled:, group-hover:   │
│                                                                 │
│  • cn() utility: merge classes, handle conditionals            │
│    cn("p-4", isActive && "bg-blue-500")                        │
│                                                                 │
│  • v4: @import "tailwindcss", @theme for custom tokens        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Build a Card**: Create a card with a title, description, and button using only Tailwind classes. Add hover effects.

2. **Responsive Layout**: Build a layout that shows 1 column on mobile, 2 columns on tablet, and 3 columns on desktop.

3. **Inspect KindleCrafter**: Open browser DevTools on KindleCrafter. Hover over elements and examine their Tailwind classes. Can you understand what each class does?

---

## What's Next?

Tailwind provides low-level utilities, but building consistent buttons, cards, and inputs from scratch is repetitive. In Chapter 12, we'll explore shadcn/ui—a component library that gives you pre-built, accessible components you can customize.

→ Continue to [Chapter 12: shadcn/ui Components](./12-shadcn-ui.md)
