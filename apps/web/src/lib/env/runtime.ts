/**
 * LECIPM Runtime Environment — safe env access for server runtime.
 *
 * These functions are for RUNTIME use only (API routes, server components).
 * They must NOT be called during build/install.
 */

/**
 * Read a required runtime env var. Throws at runtime if missing.
 * Safe during build: returns empty string if CI/VERCEL detected.
 */
export function requireRuntimeEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    if (isVercelBuild() || isCi()) {
      return "";
    }
    throw new Error(`[LECIPM] Missing required runtime env: ${name}`);
  }
  return value;
}

/**
 * Read an optional runtime env var. Returns fallback if missing.
 */
export function optionalRuntimeEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export function isVercelBuild(): boolean {
  return process.env.VERCEL === "1" && !process.env.VERCEL_ENV;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function isCi(): boolean {
  return process.env.CI === "1" || process.env.CI === "true";
}
