/**
 * Postgres RLS enablement audit for critical tables (pg_class.relrowsecurity).
 * Prisma service-role connections bypass RLS; this only verifies DB-level flags.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RLS_LOGICAL_TO_CANDIDATES, type RlsLogicalDomain } from "./rls-target-discovery.service";

export type RlsTableAuditRow = {
  logical: RlsLogicalDomain;
  physicalName: string;
  relrowsecurity: boolean;
};

export type RlsAuditResult = {
  status: "PASS" | "FAIL";
  tables: RlsTableAuditRow[];
  message: string;
};

export async function auditRowLevelSecurityEnabled(): Promise<RlsAuditResult> {
  const tables: RlsTableAuditRow[] = [];
  const missing: string[] = [];
  const disabled: string[] = [];

  try {
    for (const logical of Object.keys(RLS_LOGICAL_TO_CANDIDATES) as RlsLogicalDomain[]) {
      const candidates = RLS_LOGICAL_TO_CANDIDATES[logical];
      const rows = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>(
        Prisma.sql`
          SELECT c.relname::text AS relname, c.relrowsecurity AS relrowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relkind = 'r'
            AND c.relname IN (${Prisma.join(candidates)})
        `
      );
      const hit = rows[0];
      if (!hit) {
        missing.push(logical);
        tables.push({
          logical,
          physicalName: "(not found)",
          relrowsecurity: false,
        });
        continue;
      }
      tables.push({
        logical,
        physicalName: hit.relname,
        relrowsecurity: hit.relrowsecurity,
      });
      if (!hit.relrowsecurity) {
        disabled.push(`${logical} (${hit.relname})`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      status: "FAIL",
      tables,
      message: `RLS audit query failed: ${msg}`,
    };
  }

  if (missing.length > 0) {
    return {
      status: "FAIL",
      tables,
      message: `Missing table(s) in public schema: ${missing.join(", ")} — cannot verify RLS.`,
    };
  }
  if (disabled.length > 0) {
    return {
      status: "FAIL",
      tables,
      message: `RLS disabled on: ${disabled.join(", ")}. Enable ALTER TABLE … ENABLE ROW LEVEL SECURITY before launch.`,
    };
  }

  return {
    status: "PASS",
    tables,
    message: "RLS enabled on all audited critical tables (policies must be reviewed separately).",
  };
}
