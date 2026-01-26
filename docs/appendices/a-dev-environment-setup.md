# Appendix A: Development Environment Setup

This appendix guides you through setting up a complete development environment for working with Next.js applications like KindleCrafter.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] A computer running macOS, Windows, or Linux
- [ ] Administrator/sudo access
- [ ] ~10 GB of free disk space
- [ ] A stable internet connection

---

## 1. Install Node.js

Node.js is the JavaScript runtime that powers Next.js.

### macOS

Using Homebrew (recommended):

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

Or download the installer from [nodejs.org](https://nodejs.org).

### Windows

Download the LTS installer from [nodejs.org](https://nodejs.org) and run it.

Or use winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

### Linux (Ubuntu/Debian)

```bash
# Install via NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify Installation

```bash
node --version   # Should be 18.0.0 or higher
npm --version    # Should be 8.0.0 or higher
```

---

## 2. Install Git

Git is required for version control and deploying to Vercel.

### macOS

```bash
# Git is included with Xcode Command Line Tools
xcode-select --install

# Or install via Homebrew
brew install git
```

### Windows

Download from [git-scm.com](https://git-scm.com/download/win) or use:

```powershell
winget install Git.Git
```

### Linux

```bash
sudo apt-get install git
```

### Configure Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 3. Install a Code Editor

We recommend **Visual Studio Code**:

### Install VS Code

- Download from [code.visualstudio.com](https://code.visualstudio.com)
- Or install via package manager:

```bash
# macOS
brew install --cask visual-studio-code

# Windows
winget install Microsoft.VisualStudioCode

# Linux
sudo snap install code --classic
```

### Essential Extensions

Open VS Code and install these extensions (Ctrl/Cmd+Shift+X):

1. **ESLint**: JavaScript/TypeScript linting
2. **Prettier**: Code formatting
3. **Tailwind CSS IntelliSense**: Autocomplete for Tailwind classes
4. **ES7+ React/Redux/React-Native snippets**: Code snippets
5. **TypeScript Importer**: Auto-import suggestions

### Recommended Settings

Open Settings (Ctrl/Cmd+,) and search for these:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## 4. Set Up a GitHub Account

1. Go to [github.com](https://github.com) and create an account
2. Generate an SSH key for authentication:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

3. Add the public key to GitHub:
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste your public key

4. Test the connection:

```bash
ssh -T git@github.com
# Should say: "Hi username! You've successfully authenticated..."
```

---

## 5. Clone and Run KindleCrafter

### Clone the Repository

```bash
git clone git@github.com:your-username/KindleCrafter.git
cd KindleCrafter
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
cp .env.example .env.local
# Or create manually with required variables
```

Edit `.env.local` with your values (see Chapter 20).

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 6. Set Up Supabase (Database)

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to provision (~2 minutes)
4. Go to Settings → Database → Connection String
5. Copy the connection string and add to `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

6. Push the schema:

```bash
npx drizzle-kit push
```

---

## 7. Set Up Gmail (Email)

For the "Send to Kindle" feature:

1. Enable 2-Factor Authentication on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an "App Password" for "Mail"
4. Add to `.env.local`:

```bash
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

---

## 8. Set Up Gemini API (Podcast Feature)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google
3. Click "Get API Key" → "Create API Key"
4. Add to `.env.local`:

```bash
GEMINI_API_KEY="AIzaSy..."
```

---

## 9. Set Up Inngest (Background Jobs)

1. Create an account at [inngest.com](https://inngest.com)
2. Create a new app
3. Go to Manage → Keys
4. Add to `.env.local`:

```bash
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

---

## Troubleshooting

### "command not found: node"

Node.js isn't in your PATH. Try:
- Restart your terminal
- Reinstall Node.js
- Check PATH environment variable

### "EACCES permission denied"

On macOS/Linux, don't use `sudo` with npm. Fix permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Port 3000 already in use

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### Database connection failed

- Check DATABASE_URL is correct
- Ensure password is URL-encoded (@ becomes %40)
- Check Supabase project isn't paused

---

## Next Steps

With your development environment set up:

1. Start with [Chapter 1: How the Web Works](../part-1-foundations/01-how-the-web-works.md)
2. Follow along with the code examples
3. Experiment and break things—that's how you learn!
