# Chapter 7: State and Hooks

## Learning Objectives

By the end of this chapter, you will:

- Understand the difference between props and state
- Use `useState` to manage component state
- Use `useCallback` to memoize functions
- Handle form input with controlled components
- Understand React's re-rendering model
- See how KindleCrafter manages form state

---

## Props vs State

**Props**: Data passed from parent to child. The component receiving props *cannot* change them.

**State**: Data owned and managed by the component itself. The component *can* change its own state.

```
┌─────────────────────────────────────────────────────────────────┐
│                          PROPS                                   │
│                                                                 │
│    Parent ────── data ────→ Child                               │
│                                                                 │
│    • Read-only to the child                                     │
│    • Passed explicitly                                          │
│    • Child has no control over its props                        │
├─────────────────────────────────────────────────────────────────┤
│                          STATE                                   │
│                                                                 │
│    ┌──────────────────────────┐                                 │
│    │       Component          │                                 │
│    │  ┌──────────────────┐    │                                 │
│    │  │     state        │◄───┼── Component owns & updates      │
│    │  └──────────────────┘    │                                 │
│    └──────────────────────────┘                                 │
│                                                                 │
│    • Mutable (can be changed)                                   │
│    • Private to the component                                   │
│    • Changes trigger re-render                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The useState Hook

`useState` creates a piece of state:

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  //    │       │              │
  //    │       │              └── Initial value
  //    │       └── Function to update the value
  //    └── Current value

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

When you call `setCount`:
1. React schedules a re-render
2. The component function runs again
3. `useState` returns the new value
4. The new JSX is compared to the old
5. React updates only what changed in the DOM

### Multiple State Variables

```jsx
function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(0);

  // Each piece of state is independent
}
```

### State with Objects

```jsx
function Form() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: 0
  });

  // Update one field while preserving others
  const updateName = (newName) => {
    setFormData({
      ...formData,      // Spread existing values
      name: newName     // Override just name
    });
  };
}
```

### State with Arrays

```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text }]);
  };

  const removeTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
}
```

---

## Controlled Components

In React, form inputs are typically "controlled"—their value comes from state:

```jsx
function NameForm() {
  const [name, setName] = useState("");

  return (
    <input
      type="text"
      value={name}                          // Value from state
      onChange={(e) => setName(e.target.value)}  // Update state on change
    />
  );
}
```

The flow:
1. User types "A"
2. `onChange` fires with `e.target.value = "A"`
3. `setName("A")` updates state
4. Component re-renders with `value="A"`
5. Input displays "A"

This seems circular, but it gives React full control over the input.

### KindleCrafter's Controlled Inputs

```tsx
// components/conversion-form.tsx

const [title, setTitle] = useState<string>("");

<Input
  id="title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Book title"
  disabled={isLoading}
/>
```

The title input is controlled—its value always reflects state.

---

## Event Handlers

Events in React use camelCase naming and receive event objects:

```jsx
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  // Stop page reload
    console.log("Form submitted!");
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log("Clicked at", e.clientX, e.clientY);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("New value:", e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

### Common Event Types

| Event | React Type | Triggers On |
|-------|------------|-------------|
| onClick | `React.MouseEvent` | Element click |
| onChange | `React.ChangeEvent<HTMLInputElement>` | Input value change |
| onSubmit | `React.FormEvent` | Form submission |
| onKeyDown | `React.KeyboardEvent` | Key press |
| onFocus | `React.FocusEvent` | Element gains focus |
| onBlur | `React.FocusEvent` | Element loses focus |
| onDrag | `React.DragEvent` | Drag operation |

---

## The useCallback Hook

`useCallback` memoizes functions to prevent unnecessary re-creation:

```jsx
import { useCallback } from "react";

function Parent() {
  const [count, setCount] = useState(0);

  // Without useCallback: new function every render
  const handleClick = () => {
    console.log("Clicked");
  };

  // With useCallback: same function unless dependencies change
  const handleClickMemoized = useCallback(() => {
    console.log("Clicked");
  }, []);  // Empty dependencies = never changes

  return <Child onClick={handleClickMemoized} />;
}
```

### When to Use useCallback

1. **Passing callbacks to child components** that are optimized with `React.memo`
2. **In dependency arrays** of other hooks
3. **Event handlers** that access state

### KindleCrafter's useCallback Usage

```tsx
// components/conversion-form.tsx

const handleFileSelect = useCallback(async (selectedFile: File) => {
  if (selectedFile.size > 4 * 1024 * 1024) {
    toast.error("File too large. Maximum size is 4MB.");
    return;
  }

  const text = await selectedFile.text();
  setFile(selectedFile);
  setMarkdown(text);
  setTitle(extractTitleFromFilename(selectedFile.name));
}, []);  // No dependencies = stable function
```

```tsx
// components/file-upload.tsx

const handleDrop = useCallback(
  (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".md")) {
      onFileSelect(file);
    }
  },
  [onFileSelect, disabled]  // Re-create if these change
);
```

---

## Managing Loading State

A common pattern is tracking loading state during async operations:

```tsx
function DataFetcher() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <button onClick={fetchData}>Load Data</button>;

  return <div>{/* Render data */}</div>;
}
```

### KindleCrafter's Loading Pattern

```tsx
// components/conversion-form.tsx

const [isLoading, setIsLoading] = useState(false);

const handleDownload = async () => {
  if (!file || !markdown) {
    toast.error("Please select a file first");
    return;
  }

  setIsLoading(true);
  try {
    const result = await convertToEpub({
      markdown,
      filename: file.name,
      title: title || undefined,
      author: author || undefined,
    });

    if (result.success && result.epubBase64) {
      // Download logic...
      toast.success("EPUB downloaded!");
    } else {
      toast.error(result.message);
    }
  } catch {
    toast.error("Failed to generate EPUB");
  } finally {
    setIsLoading(false);
  }
};

// In JSX:
<Button onClick={handleDownload} disabled={isLoading}>
  {isLoading ? "Processing..." : "Download EPUB"}
</Button>
```

The button shows different text and is disabled during processing.

---

## Complete KindleCrafter Example

Here's the full ConversionForm component showing all these patterns:

```tsx
// components/conversion-form.tsx
"use client";

import { useState, useCallback } from "react";
import { FileUpload } from "./file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertToEpub, convertAndSend } from "@/app/actions/convert";
import { toast } from "sonner";

interface ConversionFormProps {
  kindleEmailConfigured: boolean;
  emailServiceConfigured: boolean;
}

export function ConversionForm({
  kindleEmailConfigured,
  emailServiceConfigured,
}: ConversionFormProps) {
  // State for form data
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");

  // State for UI
  const [isLoading, setIsLoading] = useState(false);

  // Memoized callback for file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > 4 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 4MB.");
      return;
    }

    const text = await selectedFile.text();
    setFile(selectedFile);
    setMarkdown(text);
    setTitle(extractTitleFromFilename(selectedFile.name));
  }, []);

  // Event handler for download
  const handleDownload = async () => {
    if (!file || !markdown) {
      toast.error("Please select a file first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await convertToEpub({
        markdown,
        filename: file.name,
        title: title || undefined,
        author: author || undefined,
      });

      if (result.success && result.epubBase64 && result.filename) {
        // Trigger download...
        toast.success("EPUB downloaded!");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to generate EPUB");
    } finally {
      setIsLoading(false);
    }
  };

  // Derived value
  const canSendToKindle = kindleEmailConfigured && emailServiceConfigured;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convert Markdown to EPUB</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Child component with callback prop */}
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={file}
          disabled={isLoading}
        />

        {/* Conditional rendering */}
        {file && (
          <>
            {/* Controlled inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Book title"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author (optional)</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Buttons with loading state */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? "Processing..." : "Download EPUB"}
              </Button>
              <Button
                onClick={handleSendToKindle}
                disabled={isLoading || !canSendToKindle}
                className="flex-1"
              >
                {isLoading ? "Sending..." : "Send to Kindle"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Rules of Hooks

React Hooks have strict rules:

### 1. Only Call Hooks at the Top Level

```jsx
// ❌ Bad: Hook inside condition
function Component({ isActive }) {
  if (isActive) {
    const [value, setValue] = useState(0);  // Error!
  }
}

// ✅ Good: Hook at top level
function Component({ isActive }) {
  const [value, setValue] = useState(0);  // Always called

  if (!isActive) return null;  // Conditional render is fine
}
```

### 2. Only Call Hooks from React Functions

```jsx
// ❌ Bad: Hook in regular function
function regularFunction() {
  const [value, setValue] = useState(0);  // Error!
}

// ✅ Good: Hook in React component
function ReactComponent() {
  const [value, setValue] = useState(0);  // Fine
}

// ✅ Good: Hook in custom hook
function useCustomHook() {
  const [value, setValue] = useState(0);  // Fine
}
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 7 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • State is component-owned data that can change               │
│    const [value, setValue] = useState(initialValue);           │
│                                                                 │
│  • Setting state triggers a re-render                          │
│    setValue(newValue) → component re-runs → new JSX            │
│                                                                 │
│  • Controlled inputs: value from state, onChange updates it    │
│    <input value={name} onChange={e => setName(e.target.value)} │
│                                                                 │
│  • useCallback memoizes functions                              │
│    const fn = useCallback(() => {}, [dependencies]);           │
│                                                                 │
│  • Loading pattern: isLoading state around async operations    │
│    setIsLoading(true) → try/catch → setIsLoading(false)       │
│                                                                 │
│  • Hooks rules: top-level only, React functions only           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Build a Counter**: Create a counter component with increment, decrement, and reset buttons. Display the count and disable decrement when count is 0.

2. **Create a Form**: Build a form with name, email, and message fields. Display the values below the form as you type. Add a submit button that logs the values.

3. **Loading States**: Modify your form to simulate an async submission. Show "Sending..." while processing and success/error messages after.

---

## What's Next?

We've learned React basics, but how do we create multi-page applications? In Chapter 8, we'll explore Next.js App Router—the framework that adds routing, layouts, and server-side rendering to React.

→ Continue to [Chapter 8: Next.js App Router](./08-nextjs-app-router.md)
