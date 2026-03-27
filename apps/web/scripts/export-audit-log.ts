/**
 * Export recent audit-oriented rows for compliance / debugging (JSON lines).
 *
 * Env:
 * - DATABASE_URL (via apps/web/.env)
 * - AUDIT_EXPORT_DAYS (optional, default 7)
 * - AUDIT_EXPORT_OUT (optional file path; default: stdout)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { prisma } from "../lib/db";

config({ path: path.join(__dirname, "../.env") });

async function main() {
  const days = Math.min(365, Math.max(1, parseInt(process.env.AUDIT_EXPORT_DAYS ?? "7", 10) || 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [platformEvents, financialAudit] = await Promise.all([
    prisma.platformEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 50_000,
    }),
    prisma.financialAuditLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 50_000,
    }),
  ]);

  const lines: string[] = [];
  for (const row of platformEvents) {
    lines.push(JSON.stringify({ kind: "platform_event", ...row }));
  }
  for (const row of financialAudit) {
    lines.push(JSON.stringify({ kind: "financial_audit", ...row }));
  }

  const out = process.env.AUDIT_EXPORT_OUT?.trim();
  const payload = lines.join("\n") + (lines.length ? "\n" : "");

  if (out) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, payload, "utf-8");
    console.log(`[export-audit-log] wrote ${lines.length} lines to ${out}`);
  } else {
    process.stdout.write(payload);
  }
}

main().catch((e) => {
  console.error("[export-audit-log] FAIL:", e);
  process.exit(1);
});
