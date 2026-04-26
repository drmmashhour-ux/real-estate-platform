export async function register() {
  // Order 80 — load Sentry when DSN is set (no Prisma in this module; avoids v7 init issues).
  if (process.env.SENTRY_DSN?.trim() && process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}
