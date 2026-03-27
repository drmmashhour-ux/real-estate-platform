/**
 * Atomic, collision-safe public codes (PostgreSQL upsert sequence).
 * Formats: LST-000001, USR-000001, BKG-000001, DEL-000001, DSP-000001, INV-2026-000001
 */
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

export type CodeTx = Pick<Prisma.TransactionClient, "$queryRaw">;

const PAD = 6;

export function formatPadded(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(PAD, "0")}`;
}

/** Monotonic sequence per scope; never reused after increment. */
export async function nextSequenceValue(tx: CodeTx, scope: string): Promise<number> {
  const id = randomUUID();
  const rows = await tx.$queryRaw<Array<{ next_value: number }>>(
    Prisma.sql`
      INSERT INTO platform_code_sequences (id, scope, next_value, updated_at)
      VALUES (${id}, ${scope}, 1, NOW())
      ON CONFLICT (scope) DO UPDATE SET
        next_value = platform_code_sequences.next_value + 1,
        updated_at = NOW()
      RETURNING next_value
    `
  );
  const v = rows[0]?.next_value;
  if (v == null) throw new Error("platform_code_sequences: no row returned");
  return typeof v === "bigint" ? Number(v) : v;
}

export async function generateListingCode(tx: CodeTx): Promise<string> {
  const n = await nextSequenceValue(tx, "LST");
  return formatPadded("LST", n);
}

/** Long-term rental listings on the Rent Hub (`REN-000001`). */
export async function generateRentalListingCode(tx: CodeTx): Promise<string> {
  const n = await nextSequenceValue(tx, "REN");
  return formatPadded("REN", n);
}

export async function generateUserCode(tx: CodeTx): Promise<string> {
  const n = await nextSequenceValue(tx, "USR");
  return formatPadded("USR", n);
}

export async function generateBookingCode(tx: CodeTx): Promise<string> {
  const n = await nextSequenceValue(tx, "BKG");
  return formatPadded("BKG", n);
}

export async function generateDealCode(tx: CodeTx): Promise<string> {
  const n = await nextSequenceValue(tx, "DEL");
  return formatPadded("DEL", n);
}

export async function generateDisputeCode(tx: CodeTx): Promise<string> {
  const n = await nextSequenceValue(tx, "DSP");
  return formatPadded("DSP", n);
}

/**
 * Global invoice numbers, one sequence per calendar year (INV-2026-000001).
 * Never reused; generated inside the same DB transaction as invoice insert.
 */
export async function generateInvoiceNumber(tx: CodeTx, year: number): Promise<string> {
  const n = await nextSequenceValue(tx, `INV:${year}`);
  return `INV-${year}-${String(n).padStart(PAD, "0")}`;
}

/** For backfills / scripts using the root client (each call is its own transaction). */
export async function generateListingCodeStandalone(prisma: PrismaClient): Promise<string> {
  return prisma.$transaction((tx) => generateListingCode(tx));
}

export async function generateUserCodeStandalone(prisma: PrismaClient): Promise<string> {
  return prisma.$transaction((tx) => generateUserCode(tx));
}
