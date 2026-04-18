import type { Notary } from "@prisma/client";

export type NotaryMatchInput = {
  region?: string | null;
  propertyTypeHint?: string | null;
  languagePreference?: string | null;
  limit?: number;
};

export type RankedNotary = Notary & { matchScore: number; matchReasons: string[] };

export type NotaryDealSummary = {
  dealId: string;
  dealCode: string | null;
  priceCents: number;
  pipelineState: string;
  parties: { role: string; label: string }[];
  disclaimer: string;
};
