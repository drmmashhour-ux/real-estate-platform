import { NextResponse } from "next/server";
import { z } from "zod";
import { assertNegotiationDraftAccess } from "@/app/api/negotiation/_access";
import { acceptVersion, getNegotiationChainForListing } from "@/src/modules/negotiation-chain-engine/application/negotiationChainService";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  propertyId: z.string().min(1),
  caseId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ chainId: string; versionId: string }> }) {
  const { chainId, versionId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, caseId } = parsed.data;
  const auth = await assertNegotiationDraftAccess({ listingId: propertyId, documentId: caseId ?? null });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  if (!(await getNegotiationChainForListing(chainId, propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const version = await acceptVersion(chainId, versionId);
    return NextResponse.json({ version });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
