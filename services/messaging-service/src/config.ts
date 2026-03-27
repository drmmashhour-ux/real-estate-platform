export const config = {
  port: parseInt(process.env["PORT"] ?? "3007", 10),
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  databaseUrl: process.env["DATABASE_URL"] ?? "",
};

export function validateEnv(): void {
  if (!config.databaseUrl || !config.databaseUrl.startsWith("postgresql")) {
    throw new Error("Messaging service: DATABASE_URL must be a PostgreSQL connection string.");
  }
}
