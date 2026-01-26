# Chapter 4: JavaScript for the Web

## Learning Objectives

By the end of this chapter, you will:

- Understand JavaScript's role in web applications
- Know how to interact with the DOM
- Handle events (clicks, form submissions, etc.)
- Use the Fetch API to make HTTP requests
- Understand async/await for asynchronous operations
- See how React abstracts these patterns

---

## JavaScript's Role

JavaScript is the programming language of the web. While HTML provides structure and CSS provides style, JavaScript provides **behavior**—interactivity, dynamic updates, and communication with servers.

As a programmer, you already understand variables, functions, loops, and conditionals. JavaScript has all of these with its own syntax. This chapter focuses on *web-specific* JavaScript patterns you won't have seen elsewhere.

---

## The DOM: JavaScript's View of HTML

When the browser parses HTML, it creates the **DOM** (Document Object Model)—a tree of JavaScript objects representing every element on the page. JavaScript can read and modify this tree.

```html
<div id="container">
  <h1>Hello</h1>
  <p class="intro">Welcome!</p>
</div>
```

In JavaScript, you can access these elements:

```javascript
// Find elements
const container = document.getElementById('container');
const heading = document.querySelector('h1');
const intro = document.querySelector('.intro');

// Read content
console.log(heading.textContent);  // "Hello"

// Modify content
heading.textContent = 'Goodbye';

// Modify styles
heading.style.color = 'blue';

// Add/remove classes
intro.classList.add('highlighted');
intro.classList.remove('intro');

// Create new elements
const newParagraph = document.createElement('p');
newParagraph.textContent = 'I was added by JavaScript!';
container.appendChild(newParagraph);
```

### Common DOM Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `getElementById(id)` | Find by ID | `document.getElementById('main')` |
| `querySelector(selector)` | Find first match | `document.querySelector('.card')` |
| `querySelectorAll(selector)` | Find all matches | `document.querySelectorAll('li')` |
| `createElement(tag)` | Create element | `document.createElement('div')` |
| `appendChild(node)` | Add child element | `parent.appendChild(child)` |
| `removeChild(node)` | Remove child | `parent.removeChild(child)` |
| `addEventListener(event, fn)` | Handle events | `button.addEventListener('click', fn)` |

---

## Events

Events are things that happen—clicks, key presses, form submissions, page loads. JavaScript can listen for events and respond to them.

```javascript
const button = document.querySelector('button');

button.addEventListener('click', function(event) {
  console.log('Button was clicked!');
  console.log('Event object:', event);
});
```

### Common Events

| Event | Triggers When |
|-------|---------------|
| `click` | Element is clicked |
| `submit` | Form is submitted |
| `input` | Input value changes |
| `change` | Input loses focus after changing |
| `keydown` | Key is pressed |
| `keyup` | Key is released |
| `focus` | Element gains focus |
| `blur` | Element loses focus |
| `load` | Page/image finishes loading |
| `DOMContentLoaded` | HTML is parsed (before images) |

### The Event Object

Event handlers receive an event object with useful information:

```javascript
document.addEventListener('click', function(event) {
  console.log(event.target);        // Element that was clicked
  console.log(event.currentTarget); // Element handler is attached to
  console.log(event.type);          // "click"
  console.log(event.clientX);       // Mouse X position
  console.log(event.clientY);       // Mouse Y position
});

document.addEventListener('keydown', function(event) {
  console.log(event.key);           // "Enter", "a", "Escape"
  console.log(event.code);          // "Enter", "KeyA", "Escape"
  console.log(event.shiftKey);      // true if Shift is held
  console.log(event.ctrlKey);       // true if Ctrl is held
});
```

### Preventing Default Behavior

Some events have default behaviors. Forms submit, links navigate. You can prevent this:

```javascript
form.addEventListener('submit', function(event) {
  event.preventDefault();  // Stop form from submitting normally
  // Handle the submission yourself
  console.log('Form data:', new FormData(form));
});

link.addEventListener('click', function(event) {
  event.preventDefault();  // Stop navigation
  // Do something else instead
});
```

---

## Asynchronous JavaScript

JavaScript is single-threaded but non-blocking. When you start an operation that takes time (like fetching data from a server), JavaScript doesn't wait—it continues executing other code and handles the result later.

### Callbacks (The Old Way)

```javascript
// Callback pattern - leads to "callback hell"
fetchUser(userId, function(user) {
  fetchPosts(user.id, function(posts) {
    fetchComments(posts[0].id, function(comments) {
      // Nested deeper and deeper...
    });
  });
});
```

### Promises (Better)

```javascript
fetchUser(userId)
  .then(user => fetchPosts(user.id))
  .then(posts => fetchComments(posts[0].id))
  .then(comments => {
    console.log(comments);
  })
  .catch(error => {
    console.error('Something went wrong:', error);
  });
```

### async/await (Best)

```javascript
async function loadUserData(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    console.log(comments);
  } catch (error) {
    console.error('Something went wrong:', error);
  }
}
```

`async/await` makes asynchronous code look like synchronous code:
- `async` marks a function as asynchronous
- `await` pauses execution until the promise resolves
- Use `try/catch` for error handling

---

## The Fetch API

`fetch()` makes HTTP requests from JavaScript:

### GET Request

```javascript
async function getUsers() {
  const response = await fetch('https://api.example.com/users');

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const users = await response.json();
  return users;
}
```

### POST Request

```javascript
async function createUser(userData) {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const newUser = await response.json();
  return newUser;
}
```

### Response Object

| Property/Method | Purpose |
|-----------------|---------|
| `response.ok` | `true` if status is 200-299 |
| `response.status` | HTTP status code (200, 404, etc.) |
| `response.json()` | Parse body as JSON |
| `response.text()` | Get body as text |
| `response.blob()` | Get body as binary Blob |

---

## Working with Files

In KindleCrafter, users upload Markdown files. Here's how file handling works in JavaScript:

### File Input

```html
<input type="file" id="fileInput" accept=".md" />
```

```javascript
const input = document.getElementById('fileInput');

input.addEventListener('change', async function(event) {
  const file = event.target.files[0];

  if (!file) return;

  console.log('File name:', file.name);
  console.log('File size:', file.size, 'bytes');
  console.log('File type:', file.type);

  // Read file contents as text
  const text = await file.text();
  console.log('Contents:', text);
});
```

### KindleCrafter's File Handling

Here's how KindleCrafter handles file uploads:

```tsx
// components/conversion-form.tsx

const handleFileSelect = useCallback(async (selectedFile: File) => {
  // Validate file size (4MB limit)
  if (selectedFile.size > 4 * 1024 * 1024) {
    toast.error("File too large. Maximum size is 4MB.");
    return;
  }

  // Read file contents as text
  const text = await selectedFile.text();

  // Update state with file info and contents
  setFile(selectedFile);
  setMarkdown(text);
  setTitle(extractTitleFromFilename(selectedFile.name));
}, []);
```

### Creating Downloads

After converting Markdown to EPUB, KindleCrafter triggers a download:

```tsx
// components/conversion-form.tsx

const handleDownload = async () => {
  const result = await convertToEpub({ markdown, filename: file.name });

  if (result.success && result.epubBase64) {
    // Convert base64 string to binary
    const blob = new Blob(
      [Uint8Array.from(atob(result.epubBase64), (c) => c.charCodeAt(0))],
      { type: "application/epub+zip" }
    );

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
```

This pattern:
1. Receives binary data as a base64 string from the server
2. Converts it to a `Blob` (binary large object)
3. Creates a temporary URL for the blob
4. Creates an invisible `<a>` element with `download` attribute
5. Programmatically clicks it to trigger download
6. Cleans up the temporary elements

---

## Drag and Drop

KindleCrafter supports drag-and-drop file uploads:

```tsx
// components/file-upload.tsx

const handleDrop = useCallback(
  (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();  // Required to allow drop
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".md")) {
      onFileSelect(file);
    }
  },
  [onFileSelect, disabled]
);

const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();  // Required to show drop cursor
}, []);

// In JSX:
<Card
  onDrop={handleDrop}
  onDragOver={handleDragOver}
>
```

Key points:
- `e.preventDefault()` on `dragover` is required to allow dropping
- `e.dataTransfer.files` contains the dropped files
- You must also call `e.preventDefault()` on `drop`

---

## Local Storage

Browsers provide `localStorage` for storing data that persists across sessions:

```javascript
// Store data
localStorage.setItem('theme', 'dark');
localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));

// Retrieve data
const theme = localStorage.getItem('theme');  // "dark"
const user = JSON.parse(localStorage.getItem('user'));  // { name: 'Alice' }

// Remove data
localStorage.removeItem('theme');

// Clear all data
localStorage.clear();
```

Limitations:
- Only stores strings (use `JSON.stringify`/`JSON.parse` for objects)
- ~5-10MB limit per domain
- Synchronous (can block the main thread)
- Not secure for sensitive data

---

## How React Abstracts This

In plain JavaScript, you manually update the DOM:

```javascript
// Plain JavaScript
const button = document.querySelector('#counter-btn');
const display = document.querySelector('#count');
let count = 0;

button.addEventListener('click', () => {
  count++;
  display.textContent = count;  // Manual DOM update
});
```

React abstracts this with "declarative" rendering:

```tsx
// React
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

With React:
- You describe *what* the UI should look like based on state
- React figures out *how* to update the DOM
- You never call `document.createElement` or `appendChild`

This is a fundamentally different programming model. We'll explore it in Chapter 6.

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 4 SUMMARY                          │
├─────────────────────────────────────────────────────────────────┤
│  • The DOM is JavaScript's interface to HTML                    │
│    document.querySelector, element.addEventListener             │
│                                                                 │
│  • Events: click, submit, input, change, keydown                │
│    event.preventDefault() stops default behavior                │
│                                                                 │
│  • Async/await for asynchronous operations:                     │
│    const data = await fetch(url).then(r => r.json())           │
│                                                                 │
│  • fetch() for HTTP requests from JavaScript                    │
│    Returns a Response object with .json(), .text() methods     │
│                                                                 │
│  • Files: input.files[0], file.text(), Blob, URL.createObjectURL│
│                                                                 │
│  • localStorage for persistent client-side storage              │
│                                                                 │
│  • React abstracts DOM manipulation—you declare what the UI    │
│    should look like, React handles the updates                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Event Handling**: Create a page with a button. Each click should add a new `<li>` to a list on the page showing the click timestamp.

2. **Fetch Data**: Use `fetch()` to load data from a public API like `https://jsonplaceholder.typicode.com/posts`. Display the titles on the page.

3. **File Reader**: Create a file input that accepts `.txt` files. When a file is selected, display its contents in a `<pre>` tag.

---

## What's Next?

JavaScript is powerful but has quirks—like `null` vs `undefined`, loose equality, and runtime type errors. In Chapter 5, we'll learn TypeScript, which adds type safety to JavaScript and catches errors before they happen.

→ Continue to [Chapter 5: TypeScript Essentials](./05-typescript.md)
