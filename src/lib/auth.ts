/**
 * Admin authentication helpers — Edge-runtime compatible.
 * Uses a simple password from ADMIN_PASSWORD env var + httpOnly cookie.
 * No Node.js-specific APIs (no Buffer, no crypto beyond what Edge provides).
 */

export const ADMIN_COOKIE_NAME = "trasua-admin";

/** Value stored in the cookie when authenticated */
const ADMIN_TOKEN = "authenticated";

/**
 * Validate a password attempt against ADMIN_PASSWORD env var.
 */
export function validateAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

/**
 * Check whether a raw Cookie header contains a valid admin session token.
 * Edge-compatible: parses cookies manually without Node.js dependencies.
 */
export function checkAdminCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      if (key) acc[key.trim()] = rest.join("=").trim();
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies[ADMIN_COOKIE_NAME] === ADMIN_TOKEN;
}

/**
 * Build a Set-Cookie header value for admin authentication.
 */
export function buildAdminCookie(): string {
  return `${ADMIN_COOKIE_NAME}=${ADMIN_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

/**
 * Build a Set-Cookie header value that clears the admin cookie.
 */
export function clearAdminCookie(): string {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
