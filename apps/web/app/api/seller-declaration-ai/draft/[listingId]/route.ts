import { NextResponse } from "next/server";
import { requireSellerOrAdminForListing } from "@/app/api/seller-declaration-ai/_auth";
import { getDeclarationDraft } from "@/src/modules/seller-declaration-ai/application/getDeclarationDraft";

export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const auth = await requireSellerOrAdminForListing(listingId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const draft = await getDeclarationDraft(listingId, auth.userId!, auth.isAdmin);
  return NextResponse.json({
    draft: {
      id: draft.id,
      listingId: draft.listingId,
      status: draft.status,
      draftPayload: draft.draftPayload,
      validationSummary: draft.validationSummary,
      updatedAt: draft.updatedAt,
    },
  });
}
