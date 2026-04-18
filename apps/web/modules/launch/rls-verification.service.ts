import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RlsVerificationResult = {
  status: "PASS" | "WARNING" | "FAIL";
  rlsEnabledTableCount: number;
  message: string;
};

/**
 * Postgres RLS presence check. Prisma service-role connections bypass RLS; this only counts enabled tables.
 */
export async function verifyRowLevelSecurity(): Promise<RlsVerificationResult> {
  try {
    const rows = await prisma.$queryRaw<{ tablename: string }[]>(
      Prisma.sql`
        SELECT c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relrowsecurity = true
      `
    );
    const count = rows.length;
    if (count === 0) {
      return {
        status: "WARNING",
        rlsEnabledTableCount: 0,
        message:
          "No public tables have RLS enabled — app-layer auth applies. Enable RLS in Postgres/Supabase for defense in depth.",
      };
    }
    return {
      status: "PASS",
      rlsEnabledTableCount: count,
      message: `RLS enabled on ${count} table(s) — review policies separately.`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      status: "WARNING",
      rlsEnabledTableCount: -1,
      message: `Could not inspect pg_class: ${msg}`,
    };
  }
}
