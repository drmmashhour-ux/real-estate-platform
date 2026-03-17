const MIN_SECRET_LENGTH = 32;

function parseExpiresToSeconds(value: string): number {
  const match = value.trim().match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900; // default 15m in seconds
  const num = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return num * (multipliers[unit] ?? 60);
}

export const config = {
  port: parseInt(process.env["PORT"] ?? "3001", 10),
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  databaseUrl: process.env["DATABASE_URL"] ?? "",
  jwt: {
    accessSecret: process.env["JWT_ACCESS_SECRET"] ?? "dev-access-secret-change-in-production",
    refreshSecret: process.env["JWT_REFRESH_SECRET"] ?? "dev-refresh-secret-change-in-production",
    accessExpiresIn: process.env["JWT_ACCESS_EXPIRES_IN"] ?? "15m",
    refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] ?? "7d",
  },
  get accessExpiresInSeconds(): number {
    return parseExpiresToSeconds(this.jwt.accessExpiresIn);
  },
  get refreshExpiresInSeconds(): number {
    return parseExpiresToSeconds(this.jwt.refreshExpiresIn);
  },
};

/** Validate required environment; throws with clear message if invalid. Call at startup. */
export function validateEnv(): void {
  const isProd = config.nodeEnv === "production";
  const errors: string[] = [];

  if (!config.databaseUrl || !config.databaseUrl.startsWith("postgresql")) {
    errors.push("DATABASE_URL must be a PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db)");
  }

  if (isProd) {
    if (!process.env["JWT_ACCESS_SECRET"] || process.env["JWT_ACCESS_SECRET"].length < MIN_SECRET_LENGTH) {
      errors.push(`JWT_ACCESS_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters in production`);
    }
    if (!process.env["JWT_REFRESH_SECRET"] || process.env["JWT_REFRESH_SECRET"].length < MIN_SECRET_LENGTH) {
      errors.push(`JWT_REFRESH_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters in production`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Auth service environment validation failed:\n${errors.join("\n")}`);
  }
}
