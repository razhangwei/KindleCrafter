# Chapter 6: Introduction to React

## Learning Objectives

By the end of this chapter, you will:

- Understand React's declarative programming model
- Know what components, JSX, and props are
- Create functional components
- Pass data between components with props
- Understand component composition
- See how KindleCrafter's components are structured

---

## What is React?

React is a JavaScript library for building user interfaces. It was created by Facebook (now Meta) and has become the most popular way to build web applications.

React's core idea is **declarative rendering**: you describe *what* the UI should look like based on data, and React figures out *how* to update the DOM efficiently.

### Imperative vs Declarative

**Imperative (plain JavaScript):**
```javascript
// You tell the computer WHAT to do step by step
const container = document.getElementById('app');
const heading = document.createElement('h1');
heading.textContent = 'Hello, Alice';
container.appendChild(heading);

// Later, when the name changes:
heading.textContent = 'Hello, Bob';  // Manual update
```

**Declarative (React):**
```jsx
// You describe WHAT you want, React figures out HOW
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}

// When name changes, React automatically updates the DOM
```

In React, you never call `createElement` or `appendChild`. You describe the desired state, and React handles the updates.

---

## JSX: HTML in JavaScript

JSX looks like HTML but lives inside JavaScript:

```jsx
const element = <h1>Hello, World!</h1>;
```

JSX is syntactic sugar for `React.createElement()`:

```javascript
// JSX
const element = <h1 className="title">Hello</h1>;

// Compiles to:
const element = React.createElement('h1', { className: 'title' }, 'Hello');
```

### JSX Rules

**1. Must return a single root element**

```jsx
// ❌ Invalid
return (
  <h1>Title</h1>
  <p>Paragraph</p>
);

// ✅ Valid - wrap in a div or Fragment
return (
  <div>
    <h1>Title</h1>
    <p>Paragraph</p>
  </div>
);

// ✅ Valid - Fragment (no extra DOM node)
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);
```

**2. Use `className` instead of `class`**

```jsx
<div className="container">  // Not "class"
```

**3. Close all tags**

```jsx
<img src="photo.jpg" />   // Self-closing required
<br />                     // Not just <br>
```

**4. JavaScript expressions in curly braces**

```jsx
const name = "Alice";
const count = 5;

return (
  <div>
    <h1>Hello, {name}!</h1>
    <p>Count: {count * 2}</p>
    <p>Today: {new Date().toLocaleDateString()}</p>
  </div>
);
```

---

## Components

Components are reusable pieces of UI. They're just functions that return JSX:

```jsx
function Welcome() {
  return <h1>Welcome to our site!</h1>;
}

// Use it like an HTML tag
function App() {
  return (
    <div>
      <Welcome />
      <Welcome />
    </div>
  );
}
```

### Component Naming

- Always start with a capital letter: `Welcome`, not `welcome`
- Use PascalCase: `FileUpload`, `ConversionForm`
- Lowercase = HTML element, Uppercase = React component

---

## Props: Passing Data to Components

Props (short for "properties") pass data from parent to child components:

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

function App() {
  return (
    <div>
      <Greeting name="Alice" />
      <Greeting name="Bob" />
      <Greeting name="Charlie" />
    </div>
  );
}
```

Renders:
```
Hello, Alice!
Hello, Bob!
Hello, Charlie!
```

### Props are Read-Only

Components should never modify their props:

```jsx
// ❌ Never do this
function Greeting({ name }) {
  name = name.toUpperCase();  // Modifying props - bad!
  return <h1>Hello, {name}!</h1>;
}

// ✅ Do this instead
function Greeting({ name }) {
  const formattedName = name.toUpperCase();  // Create new value
  return <h1>Hello, {formattedName}!</h1>;
}
```

### Destructuring Props

```jsx
// Without destructuring
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// With destructuring (preferred)
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Multiple props
function UserCard({ name, email, avatar }) {
  return (
    <div className="card">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}
```

### TypeScript Props

In TypeScript, define prop types with interfaces:

```tsx
interface GreetingProps {
  name: string;
  excited?: boolean;  // Optional
}

function Greeting({ name, excited = false }: GreetingProps) {
  const punctuation = excited ? "!" : ".";
  return <h1>Hello, {name}{punctuation}</h1>;
}
```

---

## Component Composition

Components can contain other components, building a tree structure:

```
App
├── Header
│   ├── Logo
│   └── Navigation
│       ├── NavLink
│       ├── NavLink
│       └── NavLink
├── Main
│   └── ConversionForm
│       ├── FileUpload
│       ├── Input (title)
│       ├── Input (author)
│       └── ButtonGroup
│           ├── Button (download)
│           └── Button (send)
└── Footer
```

Each component is responsible for its own piece of the UI.

### The `children` Prop

Components can wrap other content:

```jsx
function Card({ children, title }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Card title="Welcome">
      <p>This is the card content.</p>
      <button>Click me</button>
    </Card>
  );
}
```

The `children` prop contains whatever is between the opening and closing tags.

---

## KindleCrafter's Component Structure

Let's examine how KindleCrafter organizes its components:

### FileUpload Component

```tsx
// components/file-upload.tsx
"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  disabled,
}: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".md")) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  return (
    <Card
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed p-8 text-center ${
        disabled ? "opacity-50" : "hover:border-primary"
      }`}
    >
      <label>
        <input
          type="file"
          accept=".md"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          disabled={disabled}
          className="hidden"
        />
        {selectedFile ? (
          <div>
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p>Drop a Markdown file here or click to select</p>
          </div>
        )}
      </label>
    </Card>
  );
}
```

Key observations:

1. **Props interface**: Clearly defines what data the component needs
2. **Callback prop**: `onFileSelect` is a function passed from the parent
3. **Conditional rendering**: Different content based on `selectedFile`
4. **Composition**: Uses the `Card` component from shadcn/ui
5. **"use client"**: Marks this as a client component (we'll cover this in Chapter 9)

### How It's Used

```tsx
// components/conversion-form.tsx

<FileUpload
  onFileSelect={handleFileSelect}
  selectedFile={file}
  disabled={isLoading}
/>
```

The parent (`ConversionForm`) passes:
- A function to call when a file is selected
- The currently selected file (or null)
- Whether to disable interaction

---

## Conditional Rendering

React components often render different content based on conditions:

### Using Ternary Operator

```jsx
function Greeting({ isLoggedIn, name }) {
  return (
    <h1>
      {isLoggedIn ? `Welcome back, ${name}!` : 'Please log in'}
    </h1>
  );
}
```

### Using Logical AND

```jsx
function Notification({ count }) {
  return (
    <div>
      {count > 0 && <span className="badge">{count}</span>}
    </div>
  );
}
```

If `count > 0` is true, the `<span>` renders. If false, nothing renders.

### Early Return

```jsx
function UserProfile({ user }) {
  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### KindleCrafter Example

```tsx
// app/page.tsx

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
```

This warning only appears if the Kindle email isn't configured.

---

## Rendering Lists

Use `.map()` to render arrays of elements:

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}

// Usage
<TodoList todos={[
  { id: 1, text: 'Learn React' },
  { id: 2, text: 'Build an app' },
]} />
```

### The `key` Prop

Every element in a list needs a unique `key`:

```jsx
{items.map((item) => (
  <ListItem key={item.id} item={item} />
))}
```

Keys help React identify which items changed, were added, or removed. Use:
- Database IDs (best)
- Unique content identifiers
- Array indices (only if order never changes)

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 6 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • React uses declarative rendering—describe what you want,    │
│    React figures out how to update the DOM                     │
│                                                                 │
│  • JSX is HTML-like syntax in JavaScript                        │
│    Use {} for JavaScript expressions, className for classes    │
│                                                                 │
│  • Components are functions that return JSX                     │
│    function Button() { return <button>Click</button>; }        │
│                                                                 │
│  • Props pass data from parent to child                         │
│    <Greeting name="Alice" />                                   │
│    function Greeting({ name }) { return <h1>Hi {name}</h1>; }  │
│                                                                 │
│  • Composition: components contain other components            │
│    children prop captures content between tags                  │
│                                                                 │
│  • Conditional rendering: {condition && <Element />}           │
│  • List rendering: {items.map(item => <Item key={item.id} />)} │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Create a Card Component**: Build a reusable `Card` component that accepts `title`, `description`, and `children` props. Use it to display several cards.

2. **Build a List**: Create a `UserList` component that renders an array of users with their name and email. Remember to add keys.

3. **Trace KindleCrafter**: Open `components/conversion-form.tsx` and trace the component hierarchy. What components does it use? What props does it receive?

---

## What's Next?

Components describe UI, but applications need to respond to user input and update over time. In Chapter 7, we'll learn about state and hooks—React's system for managing data that changes.

→ Continue to [Chapter 7: State and Hooks](./07-state-and-hooks.md)
