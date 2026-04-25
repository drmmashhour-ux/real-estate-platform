const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error("\x1b[31m[CRITICAL] Missing required environment variables:\x1b[0m");
    missing.forEach((m) => console.error(`  - ${m}`));
    process.exit(1);
  }

  console.log("\x1b[32m[OK] Environment variables validated.\x1b[0m");
}

if (require.main === module) {
  validateEnv();
}
