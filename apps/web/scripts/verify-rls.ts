#!/usr/bin/env npx tsx
/**
 * LECIPM RLS verification — legacy probe + pg_class audit + per-table matrix (RLS + policy counts).
 *
 *   cd apps/web && pnpm run verify:rls
 *
 * Exit 1 when audit.status === "FAIL", matrix.overall === "FAIL", or policy check === "FAIL".
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { prisma } from "../lib/db";
import { verifyRowLevelSecurity } from "../modules/launch/rls-verification.service";
import { auditRowLevelSecurityEnabled } from "../modules/security/rls-audit.service";
import { verifyRlsPoliciesAndAppLayerExpectations } from "../modules/security/rls-policy-check.service";
import { verifyRlsTableMatrix } from "../modules/security/rls-table-matrix.service";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function main() {
  const [legacy, audit, matrix, policy] = await Promise.all([
    verifyRowLevelSecurity(),
    auditRowLevelSecurityEnabled(),
    verifyRlsTableMatrix(),
    verifyRlsPoliciesAndAppLayerExpectations(),
  ]);

  const out = {
    legacy,
    audit,
    matrix: {
      overall: matrix.overall,
      discovery: matrix.discovery,
      tables: matrix.tables,
    },
    policyCheck: {
      status: policy.status,
      message: policy.message,
      prbypassDetected: policy.prbypassDetected,
      policyCounts: policy.policyCounts,
    },
    summary: {
      overall:
        audit.status === "FAIL" || matrix.overall === "FAIL" || policy.status === "FAIL" ? "FAIL" : "PASS",
    },
  };

  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();

  const fail =
    audit.status === "FAIL" || matrix.overall === "FAIL" || policy.status === "FAIL";
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
