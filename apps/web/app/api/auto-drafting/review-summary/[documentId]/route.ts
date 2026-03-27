import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { prisma } from "@/lib/db";
import { generateDraftReviewSummary } from "@/src/modules/ai-auto-drafting/application/generateDraftReviewSummary";
import { AutoDraftDocumentType } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const facts = (doc.draftPayload ?? {}) as Record<string, unknown>;
  const out = generateDraftReviewSummary({
    documentType: AutoDraftDocumentType.SELLER_DECLARATION,
    sectionKey: "summary",
    facts,
  });
  return NextResponse.json(out);
}
