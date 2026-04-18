/**
 * Per-table RLS + policy counts for launch gates and `pnpm run verify:rls`.
 * Combines discovery with live `pg_class` / `pg_policies` queries.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RLS_LOGICAL_TO_CANDIDATES, getRlsTargetDiscovery, type RlsLogicalDomain } from "./rls-target-discovery.service";

export type RlsMatrixTableStatus = "PASS" | "FAIL" | "WARNING";

export type RlsTableMatrixRow = {
  logical: RlsLogicalDomain;
  physicalName: string;
  rlsEnabled: boolean;
  policyCount: number;
  status: RlsMatrixTableStatus;
  detail: string;
};

export type RlsTableMatrixResult = {
  overall: RlsMatrixTableStatus;
  discovery: ReturnType<typeof getRlsTargetDiscovery>;
  tables: RlsTableMatrixRow[];
};

const ALL_PHYSICAL_CANDIDATES = Array.from(
  new Set(Object.values(RLS_LOGICAL_TO_CANDIDATES).flat())
) as string[];

function physicalResolved(rows: { relname: string }[], logical: RlsLogicalDomain): string | null {
  const byName = new Map(rows.map((r) => [r.relname, r]));
  for (const name of RLS_LOGICAL_TO_CANDIDATES[logical]) {
    if (byName.has(name)) return name;
  }
  return null;
}

/**
 * One combined check: RLS enabled + at least one policy per critical table (Supabase-oriented).
 */
export async function verifyRlsTableMatrix(): Promise<RlsTableMatrixResult> {
  const discovery = getRlsTargetDiscovery();
  const tables: RlsTableMatrixRow[] = [];

  try {
    const rlsRows = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>(
      Prisma.sql`
        SELECT c.relname::text AS relname, c.relrowsecurity AS relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname IN (${Prisma.join(ALL_PHYSICAL_CANDIDATES)})
      `
    );

    const polRows = await prisma.$queryRaw<{ tablename: string; cnt: bigint }[]>(
      Prisma.sql`
        SELECT pol.tablename::text AS tablename, COUNT(*)::bigint AS cnt
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
          AND pol.tablename IN (${Prisma.join(ALL_PHYSICAL_CANDIDATES)})
        GROUP BY pol.tablename
      `
    );
    const policyCounts: Record<string, number> = {};
    for (const r of polRows) {
      policyCounts[r.tablename] = Number(r.cnt);
    }

    const relMap = new Map(rlsRows.map((x) => [x.relname, x.relrowsecurity]));

    for (const logical of Object.keys(RLS_LOGICAL_TO_CANDIDATES) as RlsLogicalDomain[]) {
      const physical = physicalResolved(rlsRows, logical);
      if (!physical) {
        tables.push({
          logical,
          physicalName: "(not found)",
          rlsEnabled: false,
          policyCount: 0,
          status: "FAIL",
          detail: "Table not found in public schema for known Prisma names — run migrations.",
        });
        continue;
      }

      const rlsEnabled = relMap.get(physical) === true;
      const policyCount = policyCounts[physical] ?? 0;

      let status: RlsMatrixTableStatus = "PASS";
      let detail = "RLS on with ≥1 policy.";

      if (!rlsEnabled) {
        status = "FAIL";
        detail = "RLS not enabled — run sql/supabase/enable-rls.sql";
      } else if (policyCount === 0) {
        status = "FAIL";
        detail = "RLS on but zero policies (deny-all risk) — run sql/supabase/rls-policies.sql";
      }

      tables.push({
        logical,
        physicalName: physical,
        rlsEnabled,
        policyCount,
        status,
        detail,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      overall: "FAIL",
      discovery,
      tables: [
        {
          logical: "bookings" as const,
          physicalName: "(error)",
          rlsEnabled: false,
          policyCount: 0,
          status: "FAIL",
          detail: msg,
        },
      ],
    };
  }

  const anyFail = tables.some((t) => t.status === "FAIL");
  const anyWarn = tables.some((t) => t.status === "WARNING");
  const overall: RlsTableMatrixResult["overall"] = anyFail ? "FAIL" : anyWarn ? "WARNING" : "PASS";

  return { overall, discovery, tables };
}
