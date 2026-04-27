import { URL } from "url";
import { config } from "dotenv";
import { resolve } from "path";
import { resolveDatabaseUrlIntoEnv } from "../lib/db/resolve-database-url";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });
resolveDatabaseUrlIntoEnv();

function maskPassword(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "****";
    }
    return parsed.toString();
  } catch {
    return "INVALID_URL_FORMAT";
  }
}

function validateDatabaseUrl() {
  const raw = process.env.DATABASE_URL;

  if (!raw) {
    console.error("❌ DATABASE_URL is missing");
    process.exit(1);
  }

  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    console.error("❌ Invalid URL format");
    process.exit(1);
  }

  const issues: string[] = [];

  if (parsed.protocol !== "postgresql:") {
    issues.push("Protocol must be postgresql://");
  }

  if (!parsed.username) {
    issues.push("Missing username");
  }

  if (!parsed.password) {
    issues.push("Missing password");
  }

  if (!parsed.hostname) {
    issues.push("Missing hostname");
  }

  if (!parsed.port) {
    issues.push("Missing port (should be 5432 for Neon pooler)");
  }

  if (!parsed.searchParams.get("sslmode")) {
    issues.push("Missing sslmode=require");
  }

  if (parsed.password && /[@:/?#%&=+]/.test(parsed.password)) {
    issues.push("Password likely needs URL encoding");
  }

  console.log("🔍 DATABASE_URL (safe):");
  console.log(maskPassword(raw));

  if (issues.length > 0) {
    console.error("❌ Issues detected:");
    issues.forEach((i) => console.error(" - " + i));
    process.exit(1);
  }

  console.log("✅ Format looks correct");
}

validateDatabaseUrl();
