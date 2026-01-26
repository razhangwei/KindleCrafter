# Appendix C: Troubleshooting

Solutions to common problems you might encounter while developing with Next.js, React, and the KindleCrafter stack.

---

## Development Server Issues

### Port 3000 is already in use

**Symptom**: Error when running `npm run dev`

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:

```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
npm run dev -- -p 3001
```

### Module not found errors

**Symptom**:
```
Module not found: Can't resolve '@/components/...'
```

**Solutions**:

1. Check the import path is correct (case-sensitive on Linux)
2. Verify the file exists
3. Try restarting the dev server
4. Delete `.next` folder and restart:

```bash
rm -rf .next
npm run dev
```

### TypeScript errors that don't show in editor

**Symptom**: Build fails with TypeScript errors you don't see in VS Code

**Solutions**:

1. Restart TypeScript server: Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server"
2. Check tsconfig.json paths match your file structure
3. Run `npx tsc --noEmit` to see all errors

---

## Database Issues

### Database connection failed

**Symptom**:
```
Error: Connection refused
Error: ECONNREFUSED
```

**Solutions**:

1. Check DATABASE_URL is set correctly in `.env.local`
2. Ensure password is URL-encoded (special characters like @ become %40)
3. Check Supabase project isn't paused (free tier pauses after inactivity)
4. Verify IP isn't blocked (Supabase → Settings → Database → Connection Pooling)

### Drizzle schema push fails

**Symptom**:
```
Error: relation "settings" already exists
```

**Solutions**:

```bash
# Drop and recreate (WARNING: deletes data)
npx drizzle-kit drop
npx drizzle-kit push

# Or use migrations for safer changes
npx drizzle-kit generate
npx drizzle-kit migrate
```

### TypeError: Cannot read properties of null

**Symptom**: Error when accessing database results

**Solution**: Check if database is configured:

```typescript
if (!db) {
  return null;  // Handle gracefully
}

const [result] = await db.select().from(table);
// result might be undefined - check before using
if (!result) {
  return null;
}
```

---

## React Component Issues

### Hooks can only be called inside a function component

**Symptom**:
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Solutions**:

1. Ensure the component is a function, not a class
2. Check for duplicate React versions: `npm ls react`
3. Don't call hooks conditionally or in loops
4. If in Next.js, add `"use client"` at the top of the file

### Hydration mismatch

**Symptom**:
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**Solutions**:

1. Don't use browser-only APIs (like `window`) during initial render:

```tsx
// ❌ Bad
const width = window.innerWidth;

// ✅ Good
const [width, setWidth] = useState(0);
useEffect(() => {
  setWidth(window.innerWidth);
}, []);
```

2. Ensure consistent rendering between server and client
3. Add `suppressHydrationWarning` to html tag (only if you understand why)

### Component not updating when state changes

**Symptom**: UI doesn't reflect state changes

**Solutions**:

1. Don't mutate state directly:

```tsx
// ❌ Bad
items.push(newItem);
setItems(items);

// ✅ Good
setItems([...items, newItem]);
```

2. Use functional updates for state based on previous state:

```tsx
// ❌ Bad (might be stale)
setCount(count + 1);

// ✅ Good
setCount(prev => prev + 1);
```

---

## Server Action Issues

### Functions cannot be passed directly to Client Components

**Symptom**:
```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
```

**Solution**: You can't pass functions as props from Server to Client Components. Instead:

```tsx
// ❌ Bad
<ClientComponent onClick={() => console.log("hi")} />

// ✅ Good - use Server Actions
// In a file marked "use server"
export async function myAction() { ... }

// In client component
import { myAction } from "@/app/actions/example";
<button onClick={() => myAction()}>Click</button>
```

### Server action returns undefined

**Symptom**: Server Action result is undefined

**Solutions**:

1. Ensure the action has `"use server"` directive
2. Check the action actually returns a value
3. Verify you're awaiting the action call:

```tsx
// ❌ Bad
const result = serverAction();

// ✅ Good
const result = await serverAction();
```

---

## Email Issues

### Emails not being sent

**Symptom**: No error, but emails don't arrive

**Solutions**:

1. Check spam/junk folder
2. Verify environment variables are set:

```bash
# In terminal
echo $GMAIL_USER
# Or in code
console.log("Gmail configured:", !!process.env.GMAIL_USER);
```

3. For Gmail, ensure:
   - 2FA is enabled on your Google account
   - You're using an App Password, not your regular password
   - The App Password has no spaces when stored

4. Check for silent failures:

```typescript
try {
  await sendToKindle(options);
} catch (error) {
  console.error("Email failed:", error);
}
```

### SMTP authentication failed

**Symptom**:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions**:

1. Regenerate Gmail App Password
2. Ensure no extra spaces in password
3. Verify account doesn't have additional security restrictions

---

## Inngest/Background Job Issues

### Jobs not running

**Symptom**: `inngest.send()` succeeds but job never runs

**Solutions**:

1. Check Inngest dashboard for queued events
2. Verify webhook URL is correct: `https://your-app.vercel.app/api/inngest`
3. Ensure function is exported in the API route:

```typescript
// app/api/inngest/route.ts
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [yourFunction],  // Is it listed here?
});
```

4. Check function ID matches event name:

```typescript
inngest.createFunction(
  { id: "my-function" },
  { event: "my/event.name" },  // Must match inngest.send()
  async () => {}
);
```

### Step failed but no retry

**Symptom**: Job fails immediately without retrying

**Solution**: Check if error is thrown correctly:

```typescript
await step.run("my-step", async () => {
  // Throw errors to trigger retries
  throw new Error("Something went wrong");

  // Don't return error objects
  return { error: "This won't retry" };  // ❌
});
```

---

## Build/Deployment Issues

### Build fails on Vercel but works locally

**Symptom**: `npm run build` works locally but fails on Vercel

**Solutions**:

1. Check environment variables are set in Vercel dashboard
2. Look at build logs in Vercel for specific errors
3. Ensure all dependencies are in `dependencies` (not `devDependencies`) if needed at runtime
4. Check for platform-specific code:

```typescript
// ❌ May fail in some environments
import fs from 'fs';
const data = fs.readFileSync('./file.json');

// ✅ Use dynamic import or check environment
if (typeof window === 'undefined') {
  // Server-only code
}
```

### Module not found in serverless function

**Symptom**:
```
Error: Cannot find module 'epub-gen-memory'
```

**Solution**: Add to `serverExternalPackages` in next.config.ts:

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["epub-gen-memory"],
};
```

---

## Performance Issues

### Slow initial page load

**Solutions**:

1. Check for unnecessary client-side JavaScript:
   - Remove `"use client"` from components that don't need it
   - Use Server Components where possible

2. Optimize images:
   ```tsx
   import Image from "next/image";
   <Image src="/photo.jpg" width={800} height={600} alt="..." />
   ```

3. Check for blocking data fetches:
   - Use loading states
   - Fetch data in parallel when possible

### Large bundle size

**Solutions**:

1. Analyze bundle:
```bash
npm run build
# Look at output for large chunks
```

2. Use dynamic imports for large libraries:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'));
```

3. Check for accidentally imported server code in client components

---

## Getting Help

If you're still stuck:

1. **Search the error message** - Often someone else has had the same issue
2. **Check GitHub Issues** - For the specific library causing problems
3. **Stack Overflow** - Tag with `next.js`, `react`, etc.
4. **Next.js Discord** - Active community for real-time help
5. **Minimal Reproduction** - Create a minimal example that reproduces the issue

When asking for help, include:
- Exact error message
- Relevant code snippets
- What you've already tried
- Your environment (Node version, OS, etc.)
