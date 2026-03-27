/**
 * PostgreSQL logical backup via `pg_dump` (self-managed or RDS-compatible URLs).
 * Requires: PostgreSQL client tools (`pg_dump` on PATH).
 *
 * Env:
 * - DATABASE_URL (required)
 * - BACKUP_DIR (optional, default: ./backups relative to cwd)
 */
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../.env") });

function redactDbHint(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("[backup-db] FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    console.error(
      "[backup-db] FAIL: DATABASE_URL must be a postgres:// or postgresql:// URL for pg_dump"
    );
    process.exit(1);
  }

  const backupDir = process.env.BACKUP_DIR?.trim() || path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(backupDir, `db-backup-${ts}.sql`);

  console.log("[backup-db] starting", { dest: outPath, db: redactDbHint(databaseUrl) });

  const child = spawn(
    "pg_dump",
    [databaseUrl, "--no-owner", "--no-acl", "--format=plain"],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    }
  );
  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  if (!child.stdout) {
    throw new Error("pg_dump: no stdout");
  }
  const out = createWriteStream(outPath, { flags: "w" });
  await pipeline(child.stdout, out);
  const [code] = await once(child, "close");
  if (code !== 0) {
    throw new Error(`pg_dump exited ${code}: ${stderr.slice(0, 2000)}`);
  }

  console.log("[backup-db] OK:", outPath);
}

run().catch((e) => {
  console.error("[backup-db] FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
