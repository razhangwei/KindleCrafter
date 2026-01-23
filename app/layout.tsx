import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
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
  description: "Convert Markdown to EPUB and send to your Kindle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
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
