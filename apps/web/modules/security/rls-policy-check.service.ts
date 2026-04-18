/**
 * RLS policy presence + Prisma bypass disclosure.
 * True row-isolation tests (guest vs host vs broker) require DB sessions with distinct roles;
 * the app server uses a privileged Prisma URL — RLS policies are not enforced for that connection.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RlsPolicyExpectation = "guest_no_cross_booking" | "host_scoped" | "broker_deals" | "admin_full";

export type RlsPolicyCheckResult = {
  status: "PASS" | "FAIL" | "WARNING";
  prbypassDetected: true;
  policyCounts: Record<string, number>;
  expectations: { case: RlsPolicyExpectation; status: "NOT_VERIFIED_DB_ROLE"; detail: string }[];
  message: string;
};

/** Physical relnames after Prisma migrate (see sql/supabase/). */
const WATCH_TABLES = ["Booking", "booking", "bnhub_listings", "User", "users", "deals", "payments"];

/** Canonical set — at least one policy each for PASS. */
const REQUIRED_CANONICAL = ["Booking", "bnhub_listings", "User", "deals", "payments"] as const;

function policyCountForCanonical(policyCounts: Record<string, number>, canonical: string): number {
  if (canonical === "Booking") {
    return policyCounts.Booking ?? policyCounts.booking ?? 0;
  }
  if (canonical === "User") {
    return policyCounts.User ?? policyCounts.users ?? 0;
  }
  return policyCounts[canonical] ?? 0;
}

function rlsEnabledForCanonical(rlsOn: Map<string, boolean>, canonical: string): boolean {
  if (canonical === "Booking") {
    return rlsOn.get("Booking") === true || rlsOn.get("booking") === true;
  }
  if (canonical === "User") {
    return rlsOn.get("User") === true || rlsOn.get("users") === true;
  }
  return rlsOn.get(canonical) === true;
}

/**
 * Counts policies per physical table; fails if RLS is on but zero policies (lockout risk).
 * PASS when all canonical critical tables have RLS enabled and at least one policy each.
 */
export async function verifyRlsPoliciesAndAppLayerExpectations(): Promise<RlsPolicyCheckResult> {
  const expectations: RlsPolicyCheckResult["expectations"] = [
    {
      case: "guest_no_cross_booking",
      status: "NOT_VERIFIED_DB_ROLE",
      detail:
        "Verify via app/API: GET /api/bnhub/bookings/:id returns 403 for non-guest/non-host; Prisma bypasses RLS.",
    },
    {
      case: "host_scoped",
      status: "NOT_VERIFIED_DB_ROLE",
      detail: "Host listing/booking APIs must scope by ownerId; Prisma service role does not enforce RLS.",
    },
    {
      case: "broker_deals",
      status: "NOT_VERIFIED_DB_ROLE",
      detail: "Broker deal routes must filter by brokerage membership; enforce in application layer.",
    },
    {
      case: "admin_full",
      status: "NOT_VERIFIED_DB_ROLE",
      detail: "Admin surfaces must use requireAdminSession / platform admin checks — not RLS alone.",
    },
  ];

  try {
    const rows = await prisma.$queryRaw<{ tablename: string; cnt: bigint }[]>(
      Prisma.sql`
        SELECT pol.tablename::text AS tablename, COUNT(*)::bigint AS cnt
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
          AND pol.tablename IN (${Prisma.join(WATCH_TABLES)})
        GROUP BY pol.tablename
      `
    );
    const policyCounts: Record<string, number> = {};
    for (const r of rows) {
      policyCounts[r.tablename] = Number(r.cnt);
    }

    const rlsRows = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>(
      Prisma.sql`
        SELECT c.relname::text AS relname, c.relrowsecurity AS relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname IN (${Prisma.join(WATCH_TABLES)})
      `
    );

    const rlsOn = new Map(rlsRows.map((x) => [x.relname, x.relrowsecurity]));
    const broken: string[] = [];
    for (const [name, on] of rlsOn) {
      if (!on) continue;
      const pc = policyCounts[name] ?? 0;
      if (pc === 0) {
        broken.push(`${name} (RLS on, 0 policies)`);
      }
    }

    if (broken.length > 0) {
      return {
        status: "FAIL",
        prbypassDetected: true,
        policyCounts,
        expectations,
        message: `RLS enabled but missing policies: ${broken.join("; ")}.`,
      };
    }

    const missingPolicy: string[] = [];
    const missingRls: string[] = [];
    for (const c of REQUIRED_CANONICAL) {
      if (!rlsEnabledForCanonical(rlsOn, c)) {
        missingRls.push(c);
      } else if (policyCountForCanonical(policyCounts, c) < 1) {
        missingPolicy.push(c);
      }
    }

    if (missingRls.length > 0 || missingPolicy.length > 0) {
      return {
        status: "FAIL",
        prbypassDetected: true,
        policyCounts,
        expectations,
        message: `RLS/policies incomplete — missing RLS: ${missingRls.join(", ") || "none"}; missing policies: ${missingPolicy.join(", ") || "none"}. Apply apps/web/sql/supabase/enable-rls.sql then rls-policies.sql.`,
      };
    }

    return {
      status: "PASS",
      prbypassDetected: true,
      policyCounts,
      expectations,
      message:
        "Critical tables have RLS enabled with at least one policy each (see sql/supabase/). Prisma service-role still bypasses RLS — keep API access guards.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      status: "WARNING",
      prbypassDetected: true,
      policyCounts: {},
      expectations,
      message: `Could not read pg_policies/pg_class: ${msg}`,
    };
  }
}
