/**
 * LECIPM shared configuration.
 * Load from env; validate with schema in app.
 */

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  api: {
    port: Number(process.env.API_PORT ?? 3000),
    basePath: process.env.API_BASE_PATH ?? "/api",
  },
  database: {
    url: process.env.DATABASE_URL ?? "",
  },
  logging: {
    level: process.env.LOG_LEVEL ?? "info",
  },
  security: {
    jwtSecret: process.env.JWT_SECRET ?? "",
    sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "lecipm_session",
  },
} as const;

export type Config = typeof config;
