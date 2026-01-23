const SESSION_COOKIE_NAME = "kindle_crafter_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Creates a session token by encoding timestamp + secret
 */
export function createSessionToken(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  const timestamp = Date.now().toString();
  const token = Buffer.from(`${timestamp}:${secret}`).toString("base64");
  return token;
}

/**
 * Validates a session token
 */
export function validateSessionToken(token: string): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return false;
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 2) {
      return false;
    }

    const [timestamp, tokenSecret] = parts;

    // Verify the secret matches
    if (tokenSecret !== secret) {
      return false;
    }

    // Check if token is expired
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime)) {
      return false;
    }

    return Date.now() - tokenTime < SESSION_DURATION;
  } catch {
    return false;
  }
}

/**
 * Verifies the password matches the environment variable
 */
export function verifyPassword(password: string): boolean {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return true; // No password set, allow access
  }
  return password === appPassword;
}

/**
 * Checks if password protection is enabled
 */
export function isPasswordProtectionEnabled(): boolean {
  return !!process.env.APP_PASSWORD;
}

export { SESSION_COOKIE_NAME, SESSION_DURATION };
