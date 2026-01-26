# Chapter 12: shadcn/ui Components

## Learning Objectives

By the end of this chapter, you will:

- Understand what shadcn/ui is and how it differs from other component libraries
- Know how to use and customize shadcn/ui components
- Understand the Radix UI primitives underneath
- Use Class Variance Authority (CVA) for variant styling
- See how KindleCrafter uses Button, Card, and Input components

---

## What is shadcn/ui?

shadcn/ui is *not* a traditional component library you install from npm. Instead, it's a collection of **copy-paste components** that live in your codebase.

### Traditional Component Library

```bash
npm install @some-ui/library
```

```tsx
import { Button } from "@some-ui/library";

// You get what you get—customization is limited
<Button variant="primary">Click me</Button>
```

### shadcn/ui Approach

```bash
npx shadcn-ui add button
```

This copies a `button.tsx` file into your project:

```tsx
// components/ui/button.tsx
// This file is YOURS - modify it however you want
```

### Why This Matters

1. **Full control**: The code is in your repo—change anything
2. **No version conflicts**: No external dependency updates breaking your app
3. **Learn from the code**: See how accessible components are built
4. **Tree shaking by default**: Only what you use is in your bundle

---

## Radix UI Primitives

shadcn/ui components are built on **Radix UI**—a library of unstyled, accessible primitives:

```tsx
// Radix provides behavior + accessibility
import * as Dialog from "@radix-ui/react-dialog";

// shadcn/ui adds styling
export function Modal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="...">Open</Dialog.Trigger>
      <Dialog.Content className="...">
        Modal content
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

Radix handles:
- Keyboard navigation (Tab, Enter, Escape)
- Focus trapping in modals
- ARIA attributes for screen readers
- Click-outside behavior
- Animation states

You just add styles with Tailwind.

---

## Installing Components

Add components individually:

```bash
# Add button
npx shadcn-ui add button

# Add multiple components
npx shadcn-ui add card input label

# Add all components (not recommended)
npx shadcn-ui add --all
```

Components are copied to `components/ui/`:

```
components/
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── label.tsx
```

---

## The Button Component

Let's examine KindleCrafter's Button:

```tsx
// components/ui/button.tsx

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

### Class Variance Authority (CVA)

CVA manages variant-based styling:

```tsx
const buttonVariants = cva(
  "base-classes-always-applied",
  {
    variants: {
      variant: {
        default: "variant-default-classes",
        destructive: "variant-destructive-classes",
      },
      size: {
        default: "size-default-classes",
        lg: "size-large-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Usage
buttonVariants({ variant: "destructive", size: "lg" });
// Returns: "base-classes destructive-classes large-classes"
```

### Using the Button

```tsx
import { Button } from "@/components/ui/button";

// Default variant and size
<Button>Click me</Button>

// Specific variant
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>

// Specific size
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>

// Combine with custom classes
<Button className="w-full">Full Width</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

### KindleCrafter's Button Usage

```tsx
// components/conversion-form.tsx

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
```

---

## The Card Component

```tsx
// components/ui/card.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid auto-rows-min items-start gap-2 px-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
```

### Using the Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
</Card>
```

### KindleCrafter's Card Usage

```tsx
// components/conversion-form.tsx

<Card>
  <CardHeader>
    <CardTitle>Convert Markdown to EPUB</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    <FileUpload ... />
    {/* ... form fields ... */}
  </CardContent>
</Card>
```

---

## The Input Component

```tsx
// components/ui/input.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
```

### Using the Input

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>
```

### With Controlled State

```tsx
const [email, setEmail] = useState("");

<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter email"
/>
```

---

## Component Composition

shadcn/ui components are designed for composition:

```tsx
// FileUpload uses Card for its container
import { Card } from "@/components/ui/card";

export function FileUpload({ ... }) {
  return (
    <Card
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed p-8 text-center"
    >
      <label>
        <input type="file" className="hidden" />
        {/* Custom content */}
      </label>
    </Card>
  );
}
```

### Pattern: Form Group

```tsx
// Reusable form field pattern
function FormField({ label, id, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

// Usage
<FormField label="Title" id="title">
  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
</FormField>
```

---

## Customizing Components

Since the code is in your repo, customize freely:

### Adding a New Variant

```tsx
// components/ui/button.tsx

const buttonVariants = cva("...", {
  variants: {
    variant: {
      // ... existing variants ...
      success: "bg-green-500 text-white hover:bg-green-600",
      warning: "bg-yellow-500 text-black hover:bg-yellow-600",
    },
  },
});
```

Now use it:

```tsx
<Button variant="success">Save</Button>
<Button variant="warning">Careful!</Button>
```

### Modifying Base Styles

```tsx
// Change all buttons to have more rounded corners
const buttonVariants = cva(
  "... rounded-full ...",  // Changed from rounded-md
  { ... }
);
```

### Component-Specific Overrides

```tsx
// Override for a specific instance
<Button className="rounded-full">Pill Button</Button>
```

The `cn()` function ensures custom classes override default ones.

---

## The Toaster Component

KindleCrafter uses `sonner` for toast notifications:

```tsx
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner";

<body>
  {/* ... */}
  <Toaster />
</body>
```

Usage in components:

```tsx
import { toast } from "sonner";

// Success
toast.success("EPUB downloaded!");

// Error
toast.error("Failed to generate EPUB");

// With description
toast.success("File converted", {
  description: "Your EPUB is ready for download",
});
```

---

## Accessibility Features

shadcn/ui components include accessibility by default:

### Keyboard Navigation

```tsx
// Button responds to Enter and Space
<Button>Press Enter or Space</Button>

// Input supports standard keyboard behavior
<Input />
```

### Focus States

```tsx
// Visible focus ring for keyboard navigation
className="focus-visible:ring-2 focus-visible:ring-ring"
```

### Disabled States

```tsx
// Visual and functional disabled state
className="disabled:pointer-events-none disabled:opacity-50"
```

### ARIA Attributes

More complex components (dialogs, dropdowns) include proper ARIA:

```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Automatically has role="dialog", aria-modal="true" */}
  </DialogContent>
</Dialog>
```

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 12 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • shadcn/ui: copy-paste components that live in your code    │
│    Full ownership, full customization                           │
│                                                                 │
│  • Built on Radix UI: accessible, unstyled primitives          │
│    Keyboard navigation, focus management, ARIA                  │
│                                                                 │
│  • CVA (Class Variance Authority): variant-based styling       │
│    cva("base", { variants: { variant: {...}, size: {...} } })  │
│                                                                 │
│  • Usage: <Button variant="outline" size="lg">                 │
│    Combines base + variant + size + custom classes             │
│                                                                 │
│  • cn() merges classes and handles conflicts                   │
│    cn(buttonVariants({ variant }), className)                  │
│                                                                 │
│  • Customize by editing the source files                        │
│    Add variants, change base styles, modify anything           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Add a New Button Variant**: Open `components/ui/button.tsx` and add a "success" variant with a green background.

2. **Create a Custom Card**: Make a "WarningCard" component that wraps Card with a yellow border and warning icon.

3. **Build a Form**: Using Label, Input, and Button components, build a simple contact form with name, email, and message fields.

---

## What's Next?

We've covered UI styling. In Part IV, we'll dive into the database layer—how KindleCrafter persists data with PostgreSQL, Drizzle ORM, and Supabase.

→ Continue to [Chapter 13: Database Fundamentals](../part-4-database/13-database-fundamentals.md)
