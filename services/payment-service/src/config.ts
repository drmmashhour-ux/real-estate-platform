export const config = {
  port: parseInt(process.env["PORT"] ?? "3006", 10),
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  databaseUrl: process.env["DATABASE_URL"] ?? "",
  /** Set to use Stripe; otherwise mock provider is used. */
  stripeSecretKey: process.env["STRIPE_SECRET_KEY"] ?? "",
};

export function validateEnv(): void {
  if (!config.databaseUrl || !config.databaseUrl.startsWith("postgresql")) {
    throw new Error("Payment service: DATABASE_URL must be a PostgreSQL connection string.");
  }
}
