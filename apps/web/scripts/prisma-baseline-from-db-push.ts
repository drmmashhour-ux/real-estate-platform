/**
 * Baseline a database that was synced with `prisma db push` (no _prisma_migrations history)
 * but already matches the migration SQL in this repo.
 *
 * Marks each migration folder as applied WITHOUT executing SQL (same as manual `migrate resolve`).
 * Safe to re-run: ignores "already recorded" (P3008).
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/prisma-baseline-from-db-push.ts
 *
 * Prerequisites: DATABASE_URL points at the target DB; schema already matches aggregate migrations.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

function migrationFolders(): string[] {
  const names = readdirSync(MIGRATIONS_DIR).filter((n) => {
    if (n === "migration_lock.toml") return false;
    const p = join(MIGRATIONS_DIR, n);
    return statSync(p).isDirectory();
  });
  return names.sort((a, b) => a.localeCompare(b));
}

function main(): void {
  const dirs = migrationFolders();
  if (!dirs.length) {
    console.error("[prisma-baseline] No migrations under prisma/migrations");
    process.exit(1);
  }
  console.log(`[prisma-baseline] Resolving ${dirs.length} migrations as applied (no SQL execution)…`);
  let ok = 0;
  for (const name of dirs) {
    const r = spawnSync(
      "pnpm",
      ["exec", "prisma", "migrate", "resolve", "--applied", name],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
      },
    );
    const err = (r.stderr || "").toString();
    const out = (r.stdout || "").toString();
    if (r.status === 0) {
      ok += 1;
      console.log(`  ✓ ${name}`);
      continue;
    }
    if (err.includes("P3008") || out.includes("P3008") || err.includes("already recorded")) {
      console.log(`  · ${name} (already applied)`);
      ok += 1;
      continue;
    }
    console.error(`  ✗ ${name}\n${out}\n${err}`);
    process.exit(1);
  }
  console.log(`[prisma-baseline] Done. ${ok}/${dirs.length} migrations recorded. Run: pnpm exec prisma migrate deploy`);
}

main();
