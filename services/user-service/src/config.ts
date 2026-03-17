export const config = {
  port: parseInt(process.env["PORT"] ?? "3002", 10),
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  databaseUrl: process.env["DATABASE_URL"] ?? "",
  jwt: {
    accessSecret: process.env["JWT_ACCESS_SECRET"] ?? "dev-access-secret-change-in-production",
  },
};

export function validateEnv(): void {
  if (!config.databaseUrl || !config.databaseUrl.startsWith("postgresql")) {
    throw new Error(
      "User service: DATABASE_URL must be a PostgreSQL connection string (same DB as auth-service)."
    );
  }
}
