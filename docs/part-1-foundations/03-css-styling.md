# Chapter 3: CSS - Styling

## Learning Objectives

By the end of this chapter, you will:

- Understand how CSS selectors target HTML elements
- Know the box model and how it affects layout
- Understand Flexbox and CSS Grid for layout
- Grasp responsive design principles
- See how CSS custom properties (variables) work
- Connect these concepts to how Tailwind CSS abstracts them

---

## What is CSS?

CSS (Cascading Style Sheets) controls how HTML looks. While HTML defines *what* appears on the page, CSS defines *how* it appears—colors, fonts, spacing, layout, animations.

```css
/* A CSS rule */
h1 {
  color: blue;
  font-size: 32px;
  margin-bottom: 16px;
}
```

This rule says: "All `<h1>` elements should be blue, 32 pixels tall, with 16 pixels of space below them."

---

## CSS Syntax

A CSS rule has three parts:

```css
selector {
  property: value;
  property: value;
}
```

- **Selector**: Which elements to style
- **Property**: What aspect to change (color, size, position)
- **Value**: The new setting

### Multiple Declarations

```css
.card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

---

## Selectors

Selectors are patterns that match elements:

### Type Selector
```css
p { color: gray; }        /* All <p> elements */
```

### Class Selector
```css
.highlight { background: yellow; }    /* class="highlight" */
```

### ID Selector
```css
#main-title { font-size: 48px; }      /* id="main-title" */
```

### Attribute Selector
```css
input[type="email"] { border-color: blue; }
```

### Descendant Selector
```css
nav a { text-decoration: none; }      /* <a> inside <nav> */
```

### Combinators

```css
/* Direct child */
ul > li { list-style: square; }

/* Adjacent sibling (immediately after) */
h2 + p { font-size: 18px; }

/* General sibling (anywhere after) */
h2 ~ p { color: gray; }
```

### Pseudo-classes

```css
a:hover { color: red; }               /* Mouse over */
button:disabled { opacity: 0.5; }     /* Disabled state */
li:first-child { font-weight: bold; } /* First in list */
input:focus { outline: 2px solid blue; }
```

### Pseudo-elements

```css
p::first-line { font-weight: bold; }
p::before { content: "→ "; }
::selection { background: yellow; }   /* Text selection */
```

---

## Specificity

When multiple rules target the same element, CSS uses **specificity** to decide which wins:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPECIFICITY HIERARCHY                       │
│                      (highest to lowest)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. !important                      (avoid when possible)       │
│  2. Inline styles                   style="color: red"         │
│  3. ID selectors                    #header                     │
│  4. Class, attribute, pseudo-class  .nav, [type], :hover       │
│  5. Type selectors, pseudo-elements p, h1, ::before            │
└─────────────────────────────────────────────────────────────────┘
```

Example:
```css
p { color: black; }           /* Specificity: 0-0-1 */
.intro { color: blue; }       /* Specificity: 0-1-0 - wins! */
#welcome { color: red; }      /* Specificity: 1-0-0 - wins over class! */
```

When specificity is equal, the last rule declared wins (the "cascade").

---

## The Box Model

Every HTML element is a rectangular box with four layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                           MARGIN                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        BORDER                           │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │                    PADDING                      │   │   │
│   │   │   ┌─────────────────────────────────────────┐   │   │   │
│   │   │   │                                         │   │   │   │
│   │   │   │              CONTENT                    │   │   │   │
│   │   │   │          (width × height)               │   │   │   │
│   │   │   │                                         │   │   │   │
│   │   │   └─────────────────────────────────────────┘   │   │   │
│   │   │                                                 │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Content**: The actual text, image, etc.
- **Padding**: Space between content and border
- **Border**: Line around the padding
- **Margin**: Space outside the border

```css
.box {
  width: 200px;
  padding: 20px;
  border: 2px solid black;
  margin: 10px;
}
```

### box-sizing

By default, `width` only sets the content width. Padding and border are added on top:
- Total width = 200 + 20 + 20 + 2 + 2 = 244px

This is confusing, so modern CSS uses:

```css
* {
  box-sizing: border-box;
}
```

Now `width: 200px` means the *total* width including padding and border is 200px. The content shrinks to fit.

---

## Display Property

The `display` property controls how elements flow:

### Block
```css
div, p, h1 { display: block; }
```
- Takes full width available
- Starts on new line
- Can set width/height

### Inline
```css
span, a, strong { display: inline; }
```
- Only takes needed width
- Flows within text
- Cannot set width/height

### Inline-Block
```css
.tag { display: inline-block; }
```
- Flows like inline
- Can set width/height

### None
```css
.hidden { display: none; }
```
- Element is removed from the page entirely

---

## Flexbox

Flexbox is for one-dimensional layouts—either a row or column:

```css
.container {
  display: flex;
  flex-direction: row;      /* or column */
  justify-content: center;  /* main axis alignment */
  align-items: center;      /* cross axis alignment */
  gap: 16px;                /* space between items */
}
```

### Flexbox Diagram

```
                    justify-content
              ←─────────────────────────→

         ↑    ┌───┐  ┌───┐  ┌───┐  ┌───┐
         │    │ 1 │  │ 2 │  │ 3 │  │ 4 │
  align- │    └───┘  └───┘  └───┘  └───┘
  items  │
         ↓    ────────────────────────────
              flex-direction: row →
```

### justify-content Options

| Value | Effect |
|-------|--------|
| `flex-start` | Pack items to start |
| `flex-end` | Pack items to end |
| `center` | Center items |
| `space-between` | Even space between items |
| `space-around` | Even space around items |
| `space-evenly` | Equal space everywhere |

### align-items Options

| Value | Effect |
|-------|--------|
| `flex-start` | Align to top (row) or left (column) |
| `flex-end` | Align to bottom (row) or right (column) |
| `center` | Center on cross axis |
| `stretch` | Stretch to fill container |
| `baseline` | Align text baselines |

### Flex Item Properties

```css
.item {
  flex-grow: 1;      /* How much to grow relative to siblings */
  flex-shrink: 0;    /* How much to shrink */
  flex-basis: 200px; /* Starting size */

  /* Shorthand: */
  flex: 1;           /* flex-grow: 1, flex-shrink: 1, flex-basis: 0 */
}
```

### KindleCrafter's Navigation

```tsx
// app/layout.tsx
<nav className="container mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
```

In Tailwind:
- `flex` = `display: flex`
- `items-center` = `align-items: center`
- `justify-between` = `justify-content: space-between`

---

## CSS Grid

Grid is for two-dimensional layouts—both rows and columns:

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;   /* 3 columns */
  grid-template-rows: auto 1fr auto;     /* 3 rows */
  gap: 16px;
}
```

### Grid Example

```css
.layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

This creates:
```
┌────────────────────────────────────────┐
│                header                  │ 60px
├──────────┬─────────────────────────────┤
│          │                             │
│ sidebar  │          main               │ 1fr (fills remaining)
│          │                             │
│  250px   │     1fr (fills space)       │
├──────────┴─────────────────────────────┤
│                footer                  │ 40px
└────────────────────────────────────────┘
```

### When to Use Flexbox vs Grid

| Use Flexbox | Use Grid |
|-------------|----------|
| Navigation bars | Page layouts |
| Centering content | Card grids |
| Button groups | Complex forms |
| One-dimensional layouts | Two-dimensional layouts |

---

## Responsive Design

Websites must work on screens from 320px (phones) to 2560px (monitors). CSS provides **media queries** to apply different styles at different sizes.

```css
/* Mobile-first approach: default styles for mobile */
.container {
  padding: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 48px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Common Breakpoints

| Name | Min Width | Typical Devices |
|------|-----------|-----------------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

### Responsive Units

| Unit | Meaning | Use Case |
|------|---------|----------|
| `px` | Pixels (absolute) | Borders, icons |
| `%` | Percentage of parent | Fluid widths |
| `em` | Multiple of parent font-size | Typography spacing |
| `rem` | Multiple of root font-size | Consistent spacing |
| `vw` | Percentage of viewport width | Full-width elements |
| `vh` | Percentage of viewport height | Full-height sections |

---

## CSS Custom Properties (Variables)

CSS variables (custom properties) let you define reusable values:

```css
:root {
  --primary-color: #0066cc;
  --spacing-unit: 8px;
  --border-radius: 4px;
}

.button {
  background: var(--primary-color);
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius);
}
```

### Theming with Variables

KindleCrafter uses CSS variables for dark mode:

```css
/* app/globals.css */
:root {
  --background: oklch(1 0 0);         /* White */
  --foreground: oklch(0.145 0 0);     /* Near-black */
  --primary: oklch(0.205 0 0);
  --muted-foreground: oklch(0.556 0 0);
}

.dark {
  --background: oklch(0.145 0 0);     /* Near-black */
  --foreground: oklch(0.985 0 0);     /* Near-white */
  --primary: oklch(0.922 0 0);
  --muted-foreground: oklch(0.708 0 0);
}
```

When the `.dark` class is applied to `<html>`, all the variables switch values, and every element using those variables automatically updates.

---

## Adding CSS to HTML

### External Stylesheet (Preferred)
```html
<link rel="stylesheet" href="styles.css">
```

### Internal Stylesheet
```html
<style>
  p { color: gray; }
</style>
```

### Inline Styles (Avoid)
```html
<p style="color: gray;">Text</p>
```

---

## How Tailwind Changes This

In traditional CSS, you write styles in separate files:

```css
/* styles.css */
.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}
```

```html
<div class="card">
  <h2 class="card-title">Title</h2>
</div>
```

With Tailwind, you apply utility classes directly:

```html
<div class="bg-white rounded-lg p-6 shadow">
  <h2 class="text-lg font-semibold">Title</h2>
</div>
```

Each class does one thing:
- `bg-white` → `background: white`
- `rounded-lg` → `border-radius: 0.5rem`
- `p-6` → `padding: 1.5rem`
- `shadow` → `box-shadow: ...`
- `text-lg` → `font-size: 1.125rem`
- `font-semibold` → `font-weight: 600`

We'll cover Tailwind in depth in Chapter 11.

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 3 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • CSS controls appearance: selector { property: value; }       │
│                                                                 │
│  • Selectors target elements: type, .class, #id, [attr]        │
│                                                                 │
│  • Box model: content + padding + border + margin               │
│    Use box-sizing: border-box for intuitive sizing             │
│                                                                 │
│  • Flexbox: one-dimensional layouts (row or column)            │
│    display: flex, justify-content, align-items                  │
│                                                                 │
│  • Grid: two-dimensional layouts (rows AND columns)            │
│    display: grid, grid-template-columns/rows                    │
│                                                                 │
│  • Responsive design: @media queries apply styles at           │
│    different screen sizes                                       │
│                                                                 │
│  • CSS variables: --custom-property: value; var(--name)        │
│    Enable theming (light/dark mode)                            │
│                                                                 │
│  • Tailwind: utility-first approach—tiny classes instead       │
│    of custom CSS rules                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Build a Card**: Create an HTML file with a card component. Style it with CSS using:
   - A white background
   - Rounded corners
   - Padding
   - A subtle box shadow
   - A title and some text inside

2. **Flexbox Navigation**: Create a navigation bar with a logo on the left and links on the right using Flexbox. Make sure items are vertically centered.

3. **Inspect KindleCrafter**: Open the browser DevTools on KindleCrafter's pages. Inspect elements and look at the Tailwind classes applied. In the "Computed" tab, see the actual CSS values.

---

## What's Next?

HTML provides structure, CSS provides style, but neither provides *behavior*. In Chapter 4, we'll learn JavaScript—the programming language that brings web pages to life.

→ Continue to [Chapter 4: JavaScript for the Web](./04-javascript-essentials.md)
