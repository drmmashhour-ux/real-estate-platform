import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Append a Supabase listing price point for analytics / AI history. */
export async function recordBnhubSupabasePricingSnapshot(params: {
  supabaseListingId: string;
  priceCents: number;
  source?: string;
  factorsJson?: Record<string, unknown>;
}): Promise<void> {
  const id = params.supabaseListingId.trim();
  if (!id || !Number.isFinite(params.priceCents)) return;

  await prisma.bnhubSupabasePricingSnapshot.create({
    data: {
      supabaseListingId: id,
      priceCents: Math.round(params.priceCents),
      source: params.source?.trim().slice(0, 64) || "system",
      factorsJson:
        params.factorsJson != null ? (params.factorsJson as Prisma.InputJsonValue) : undefined,
    },
  });
}
