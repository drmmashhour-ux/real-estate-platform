const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const localUrl =
  "postgresql://postgres:postgres@localhost:5433/lecipm_dev?schema=public";

let existing = "";
if (fs.existsSync(envPath)) {
  existing = fs.readFileSync(envPath, "utf8");
}

const backupPath = path.join(
  __dirname,
  "..",
  `.env.local.backup.${Date.now()}`,
);

if (existing.trim()) {
  fs.writeFileSync(backupPath, existing);
  console.log(`Backup created: ${backupPath}`);
}

const lines = existing.split(/\r?\n/).filter((line) => {
  const t = line.trim();
  return !t.startsWith("DATABASE_URL=") && !t.startsWith("export DATABASE_URL=");
});

lines.push("");
lines.push("# Local development fallback database");
lines.push(`DATABASE_URL="${localUrl}"`);

fs.writeFileSync(envPath, lines.join("\n"));

console.log("Updated .env.local to use local Postgres.");
console.log("DATABASE_URL=postgresql://postgres:****@localhost:5433/lecipm_dev?schema=public");
