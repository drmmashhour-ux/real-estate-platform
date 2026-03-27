import { NextResponse } from "next/server";
import { z } from "zod";
import { assertNegotiationDraftAccess } from "@/app/api/negotiation/_access";
import { createCounterOffer, getNegotiationChainForListing } from "@/src/modules/negotiation-chain-engine/application/negotiationChainService";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
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

export async function POST(request: Request, context: { params: Promise<{ chainId: string }> }) {
  const { chainId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, caseId, role, terms, clauses } = parsed.data;
  const auth = await assertNegotiationDraftAccess({ listingId: propertyId, documentId: caseId ?? null });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  if (!(await getNegotiationChainForListing(chainId, propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await createCounterOffer({
    chainId,
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
