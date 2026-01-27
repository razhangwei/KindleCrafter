import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = "kindle_crafter_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SALT_ROUNDS = 10;

export interface SessionPayload {
  userId: string;
  timestamp: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a session token for a user by encoding userId + timestamp + secret
 */
export function createSessionToken(userId: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  const timestamp = Date.now().toString();
  const token = Buffer.from(`${userId}:${timestamp}:${secret}`).toString("base64");
  return token;
}

/**
 * Validates a session token and returns the user ID if valid
 */
export function validateSessionToken(token: string): SessionPayload | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return null;
    }

    const [userId, timestamp, tokenSecret] = parts;

    // Verify the secret matches
    if (tokenSecret !== secret) {
      return null;
    }

    // Check if token is expired
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) {
      return null;
    }

    if (Date.now() - tokenTime >= SESSION_DURATION) {
      return null;
    }

    return { userId, timestamp: tokenTime };
  } catch {
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return user || null;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user || null;
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, name?: string) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
    })
    .returning();

  return user;
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await verifyPasswordHash(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Legacy: Checks if password protection is enabled (for backwards compatibility during migration)
 */
export function isPasswordProtectionEnabled(): boolean {
  // Always require authentication in multi-user mode
  return true;
}

export { SESSION_COOKIE_NAME, SESSION_DURATION };
