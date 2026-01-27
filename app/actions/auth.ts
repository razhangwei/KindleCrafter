"use server";

import { cookies } from "next/headers";
import {
  authenticateUser,
  createSessionToken,
  createUser,
  getUserByEmail,
  validateSessionToken,
  getUserById,
  SESSION_COOKIE_NAME,
  SESSION_DURATION,
} from "@/lib/auth";

interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Validate password
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    // Add delay to prevent user enumeration
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: false, error: "An account with this email already exists" };
  }

  try {
    const user = await createUser(email, password, name);
    const token = createSessionToken(user.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION / 1000,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("[register] Error:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const user = await authenticateUser(email, password);

  if (!user) {
    // Add delay to prevent brute force timing attacks
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: false, error: "Invalid email or password" };
  }

  const token = createSessionToken(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });

  return { success: true };
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = validateSessionToken(token);
  if (!session) {
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return null;
  }

  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
