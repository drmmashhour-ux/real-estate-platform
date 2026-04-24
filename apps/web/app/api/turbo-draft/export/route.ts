import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { logTurboDraftEvent } from "@/modules/turbo-form-drafting/auditLogger";
import { generateDraftHash, storeDraftHash } from "@/modules/production-guard/hashSystem";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { draftId } = await req.json();

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    // @ts-ignore
    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // 1. Payment check (MOCK)
    const context = draft.contextJson as any;
    const isBroker = context.role === "BROKER" || context.role === "ADMIN";
    
    // Check for paid state in metadata (MOCK - would use real Stripe fulfillment)
    const isPaid = draft.status === "PAID" || isBroker || draft.status === "DEAL_CREATED";

    if (!isPaid) {
      return NextResponse.json({ 
        error: "PAYMENT_REQUIRED", 
        message: "Payment of $15 is required to export this contract.",
        checkoutUrl: "/api/stripe/checkout" 
      }, { status: 402 });
    }

    // 2. Export logic (MOCK PDF generation)
    const pdfUrl = `https://storage.lecipm.com/drafts/${draftId}.pdf`;
    
    // 3. Final Integrity Hashing (ProductionGuard)
    const contentToHash = JSON.stringify(draft.resultJson);
    const hash = generateDraftHash(contentToHash);
    await storeDraftHash(draftId, hash, prisma);

    await logTurboDraftEvent({
      draftId,
      userId: auth.user.id,
      eventKey: "turbo_draft_exported",
      severity: "INFO",
      payload: { format: "PDF", hash },
    });

    return NextResponse.json({ success: true, pdfUrl, hash });
  } catch (err) {
    console.error("[api:turbo-draft:export] error", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
