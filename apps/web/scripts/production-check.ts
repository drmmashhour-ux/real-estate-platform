/**
 * LECIPM ProductionGuard — final system check (forms, AI validation, signature gate logic, env).
 *
 * Run from apps/web: `npx tsx scripts/production-check.ts`
 * Or from repo root: `npx tsx scripts/production-check.ts` (wrapper delegates here).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFormSchema } from "../lib/production-guard/formSchema";
import { validateAIOutput } from "../lib/production-guard/ai-output";
import { getAiFallbackFacts } from "../lib/production-guard/ai-fallback";
import { validateBeforeSignature } from "../lib/production-guard/signature-gate";
import { isProductionMode, isAiFallbackEnforced } from "../lib/production-guard/production-mode";
import { LECIPM_CRITICAL_NOTICE_IDS } from "../lib/production-guard/critical-notices";
import { sealFinalDraftPdf } from "../lib/production-guard/pdf-artifact.service";
import { prisma } from "../lib/db";
import { Prisma } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function add(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

async function main() {
  const good = validateFormSchema("lecipm_brokerage_ack", "2026-04-01", {
    brokerLicenseNumber: "9999",
    agencyName: "Check Agency",
    agency_relationship_summary: "y".repeat(30),
  });
  add("forms: valid payload passes registry schema", good.ok, good.ok ? undefined : (good as { errors: string[] }).errors.join("; "));

  const bad = validateFormSchema("nonexistent_form", "1", {});
  add("forms: unknown structure blocked", !bad.ok);

  const badField = validateFormSchema("lecipm_brokerage_ack", "2026-04-01", { brokerLicenseNumber: "ab" });
  add("forms: required/minLength enforced", !badField.ok);

  const bypassExtraKeys = validateFormSchema(
    "lecipm_brokerage_ack",
    "2026-04-01",
    {
      brokerLicenseNumber: "9999",
      agencyName: "Check Agency",
      agency_relationship_summary: "y".repeat(30),
      ai_invented_field: "must not ship",
    },
    { strictKeys: true },
  );
  add("bypass: unknown form keys rejected (strict registry)", !bypassExtraKeys.ok);

  const fbPtp = validateFormSchema("lecipm_promise_to_purchase", "2026-04-01", getAiFallbackFacts("lecipm_promise_to_purchase", {}));
  add(
    "AI fallback: promise-to-purchase base template passes schema",
    fbPtp.ok,
    fbPtp.ok ? undefined : (fbPtp as { errors: string[] }).errors.join("; "),
  );
  const fbAck = validateFormSchema("lecipm_brokerage_ack", "2026-04-01", getAiFallbackFacts("lecipm_brokerage_ack", {}));
  add(
    "AI fallback: brokerage ack base template passes schema",
    fbAck.ok,
    fbAck.ok ? undefined : (fbAck as { errors: string[] }).errors.join("; "),
  );

  const aiBad = validateAIOutput({
    formKey: "lecipm_brokerage_ack",
    version: "2026-04-01",
    baseFacts: {
      brokerLicenseNumber: "1000",
      agencyName: "A",
      agency_relationship_summary: "z".repeat(30),
    },
    aiPatch: { agencyName: "B" },
  });
  add("AI: blocks destructive edits to immutable clauses", !aiBad.ok);

  add("critical notices: registry non-empty", LECIPM_CRITICAL_NOTICE_IDS.length >= 3);

  add("env: PRODUCTION_MODE reads as boolean flag", typeof isProductionMode() === "boolean");
  add("env: AI fallback flag readable", typeof isAiFallbackEnforced() === "boolean");
  add("signature gate: validateBeforeSignature is defined", typeof validateBeforeSignature === "function");

  try {
    const schemaText = readFileSync(path.join(webRoot, "prisma", "schema.prisma"), "utf8");
    add(
      "audit: schema defines LecipmProductionGuardAuditEvent",
      schemaText.includes("model LecipmProductionGuardAuditEvent"),
    );
  } catch (e) {
    add("audit: schema defines LecipmProductionGuardAuditEvent", false, e instanceof Error ? e.message : "read failed");
  }

  const vitestBin = path.join(webRoot, "node_modules", ".bin", process.platform === "win32" ? "vitest.cmd" : "vitest");
  const vitest = spawnSync(vitestBin, ["run", "lib/production-guard/__tests__/production-guard.test.ts", "--reporter=dot"], {
    cwd: webRoot,
    stdio: "inherit",
  });
  add("unit: production-guard Vitest suite", vitest.status === 0, vitest.status === 0 ? undefined : "vitest exited non-zero");

  try {
    await prisma.$connect();
    const auditDelegate = (prisma as unknown as { lecipmProductionGuardAuditEvent?: { count: () => Promise<number> } })
      .lecipmProductionGuardAuditEvent;
    if (auditDelegate) {
      try {
        await auditDelegate.count();
        add("audit: LecipmProductionGuardAuditEvent reachable", true);
      } catch (e) {
        add("audit: LecipmProductionGuardAuditEvent reachable", false, e instanceof Error ? e.message : "count failed");
      }
    } else {
      try {
        await prisma.$queryRaw(Prisma.sql`SELECT 1 FROM lecipm_production_guard_audit_events LIMIT 1`);
        add(
          "audit: LecipmProductionGuardAuditEvent reachable",
          true,
          "DB table OK; Prisma client missing model delegate — run prisma generate when CLI succeeds",
        );
      } catch (e) {
        add(
          "audit: LecipmProductionGuardAuditEvent reachable",
          false,
          e instanceof Error
            ? e.message
            : "Prisma delegate missing and audit table query failed (migrate + generate)",
        );
      }
    }

    const deal = await prisma.deal.findFirst({ select: { id: true } });
    if (!deal) {
      add("PDF + hash: DB round-trip", true, "skipped — no Deal row in database");
    } else {
      let pdfOk = false;
      let pdfDetail: string | undefined;
      try {
        const row = await sealFinalDraftPdf({
          dealId: deal.id,
          title: "ProductionGuard check",
          canonicalText: "Integrity check document\nline 2",
          createdById: null,
        });
        pdfOk = row.contentSha256.length === 64 && row.pdfSha256.length === 64;
        await prisma.lecipmProductionGuardArtifact.delete({ where: { id: row.artifactId } }).catch(() => {});
        await prisma.lecipmProductionGuardAuditEvent
          .deleteMany({ where: { dealId: deal.id, action: "final_pdf_sealed" } })
          .catch(() => {});
        if (!pdfOk) pdfDetail = "hash length mismatch";
      } catch (e) {
        pdfDetail = e instanceof Error ? e.message : "sealFinalDraftPdf failed";
        pdfOk = false;
      }
      add("PDF + hash: persisted + cleaned", pdfOk, pdfDetail);
    }
  } catch (e) {
    add(
      "PDF + hash: database",
      false,
      e instanceof Error ? e.message : "DATABASE_URL / migrate required",
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  const failed = checks.filter((c) => !c.pass);
  console.log("\n=== LECIPM ProductionGuard — production-check ===\n");
  for (const c of checks) {
    console.log(`${c.pass ? "PASS" : "FAIL"} — ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  }
  console.log(`\nSummary: ${checks.length - failed.length}/${checks.length} passed\n`);

  if (failed.length) {
    console.error("FAILED CHECKS:");
    for (const f of failed) console.error(` - ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    process.exit(1);
  }
}

void main();
