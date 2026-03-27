import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertNegotiationDraftAccess } from "@/app/api/negotiation/_access";
import { createOffer, getNegotiationHistory } from "@/src/modules/negotiation-chain-engine/application/negotiationChainService";
import {
  formatNegotiationDiffSummary,
  getNegotiationSnapshotForCase,
} from "@/src/modules/negotiation-chain-engine/application/negotiationSnapshot";

export const dynamic = "force-dynamic";

const createOfferBodySchema = z.object({
  propertyId: z.string().min(1),
  caseId: z.string().min(1).nullable().optional(),
  role: z.enum(["buyer", "seller", "broker"]),
  terms: z.object({
    priceCents: z.number().int().positive(),
    depositCents: z.number().int().nonnegative().nullable(),
    financingTerms: z.record(z.string(), z.unknown()).optional(),
    commissionTerms: z.record(z.string(), z.unknown()).optional(),
    deadlines: z.record(z.string(), z.unknown()).optional(),
  }),
  clauses: z
    .array(
      z.object({
        clauseType: z.string().min(1),
        text: z.string().min(1),
        addedInVersion: z.number().int().positive(),
        removed: z.boolean().optional(),
      }),
    )
    .default([]),
});

/** GET ?propertyId=&caseId= — latest chain + active version + history. */
export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId") ?? "";
  const caseId = request.nextUrl.searchParams.get("caseId");
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const auth = await assertNegotiationDraftAccess({ listingId: propertyId, documentId: caseId });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const snap = await getNegotiationSnapshotForCase(propertyId, caseId != null && caseId !== "" ? caseId : null);
  if (!snap.chain) {
    return NextResponse.json({
      chain: null,
      activeVersion: null,
      previousVersion: null,
      diffFromPrevious: null,
      diffSummaryLines: [],
      history: [],
    });
  }

  const history = await getNegotiationHistory(snap.chain.id);
  const diffSummaryLines = snap.diffFromPrevious ? formatNegotiationDiffSummary(snap.diffFromPrevious) : [];

  return NextResponse.json({
    chain: snap.chain,
    activeVersion: snap.activeVersion,
    previousVersion: snap.previousVersion,
    diffFromPrevious: snap.diffFromPrevious,
    diffSummaryLines,
    history,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = createOfferBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, caseId, role, terms, clauses } = parsed.data;
  const auth = await assertNegotiationDraftAccess({ listingId: propertyId, documentId: caseId ?? null });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const version = await createOffer({
    propertyId,
    caseId: caseId ?? null,
    createdBy: auth.userId,
    role,
    terms: {
      priceCents: terms.priceCents,
      depositCents: terms.depositCents,
      financingTerms: (terms.financingTerms ?? {}) as Record<string, unknown>,
      commissionTerms: (terms.commissionTerms ?? {}) as Record<string, unknown>,
      deadlines: (terms.deadlines ?? {}) as Record<string, unknown>,
    },
    clauses: clauses.map((c) => ({
      clauseType: c.clauseType,
      text: c.text,
      addedInVersion: c.addedInVersion,
      removed: c.removed ?? false,
    })),
  });

  return NextResponse.json({ version });
}
