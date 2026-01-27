import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "kindle_crafter_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth pages and static assets
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate session token (format: userId:timestamp:secret)
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = Buffer.from(sessionToken, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const [, timestamp, tokenSecret] = parts;

    if (tokenSecret !== secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime) || Date.now() - tokenTime >= SESSION_DURATION) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
