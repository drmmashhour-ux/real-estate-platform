import type { Prisma } from "@/generated/prisma";

/** Map marketplace `category` field → short prefix (SY-28). */
export const CATEGORY_PREFIX: Record<string, string> = {
  real_estate: "RE",
  stay: "ST",
  cars: "CA",
  electronics: "EL",
  furniture: "FU",
  services: "SE",
  other: "OT",
};

export function categoryToPrefix(category: string): string {
  return CATEGORY_PREFIX[category] ?? CATEGORY_PREFIX.other;
}

export function formatAdCode(prefix: string, num: number): string {
  return `${prefix}-${num}`;
}

/** Must match `CATEGORY_PREFIX` values (stable order for the regex). */
const AD_CODE_FULL = /^(RE|ST|CA|EL|FU|SE|OT)-(\d+)$/i;

/** Normalize "re-1023" / "RE 1023" → "RE-1023" or null if not a code-shaped query. */
export function tryNormalizeAdCodeQuery(raw: string): string | null {
  const t = raw.replace(/\s+/g, "").trim();
  if (!t) return null;
  const m = t.toUpperCase().match(AD_CODE_FULL);
  if (!m) return null;
  return `${m[1]!.toUpperCase()}-${m[2]!}`;
}

/**
 * One global monotonic number; prefix is taken from listing category. Atomic via PostgreSQL.
 * Sequence row must exist (migration); starts so first assigned number is 1001.
 */
export async function allocateAdCodeInTransaction(
  tx: Prisma.TransactionClient,
  category: string,
): Promise<string> {
  const prefix = categoryToPrefix(category);
  const rows = await tx.$queryRaw<[{ next_seq: number }]>`
    UPDATE syria_ad_code_sequence
    SET next_seq = next_seq + 1
    WHERE id = 'global'
    RETURNING next_seq
  `;
  const n = rows[0]?.next_seq;
  if (n === undefined || !Number.isFinite(n)) {
    throw new Error("Syria ad code sequence missing — run migrations (syria_ad_code_sequence).");
  }
  return formatAdCode(prefix, n);
}
