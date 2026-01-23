"use server";

import { cookies } from "next/headers";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION,
} from "@/lib/auth";

export async function login(
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!verifyPassword(password)) {
    // Add delay to prevent brute force timing attacks
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: false, error: "Invalid password" };
  }

  const token = createSessionToken();

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

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
