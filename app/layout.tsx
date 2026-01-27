import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LogoutButton } from "@/components/logout-button";
import { cookies } from "next/headers";
import Link from "next/link";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KindleCrafter",
  description: "Convert content to EPUB and send to your Kindle",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? validateSessionToken(sessionToken) : null;
  const isAuthenticated = !!session;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <header className="border-b">
          <nav className="container mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              KindleCrafter
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <>
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
                  <LogoutButton />
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="container mx-auto max-w-2xl px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
