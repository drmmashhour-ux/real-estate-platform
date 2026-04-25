import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { logTurboDraftEvent } from "@/modules/turbo-form-drafting/auditLogger";
import { generateDraftHash, storeDraftHash } from "@/modules/production-guard/hashSystem";
import { getExportCreditBalance, tryConsumeOneExportCredit } from "@/modules/revenue/usage-credit.service";
import { BROKER_CREDIT_OFFERS, BROKER_EXPORT_CREDIT_PAYMENT_TYPE } from "@/modules/revenue/broker-credits.config";

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

    if (draft.userId && draft.userId !== auth.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const isAdminUser = auth.user.role === PlatformRole.ADMIN;
    /** Single-checkout or pipeline states — no per-export credit. */
    const legacyPaid = draft.status === "PAID" || draft.status === "DEAL_CREATED" || isAdminUser;

    if (!legacyPaid) {
      const balance = await getExportCreditBalance(auth.user.id);
      if (balance < 1) {
        return NextResponse.json(
          {
            error: "PAYMENT_REQUIRED",
            message: "Crédit d’export requis (15 $ par utilisation ou pack 10).",
            paymentType: BROKER_EXPORT_CREDIT_PAYMENT_TYPE,
            userId: auth.user.id,
            offerA: { amountCents: BROKER_CREDIT_OFFERS.A.priceCents, offerType: "A", quantity: 1 },
            offerB: { amountCents: BROKER_CREDIT_OFFERS.B.priceCents, offerType: "B", quantity: 10 },
            checkoutUrl: "/api/stripe/checkout",
          },
          { status: 402 }
        );
      }

      const consumed = await tryConsumeOneExportCredit(auth.user.id);
      if (!consumed) {
        return NextResponse.json(
          {
            error: "PAYMENT_REQUIRED",
            message: "Crédits insuffisants — achetez un crédit ou un pack.",
            paymentType: BROKER_EXPORT_CREDIT_PAYMENT_TYPE,
            userId: auth.user.id,
            offerA: { amountCents: BROKER_CREDIT_OFFERS.A.priceCents, offerType: "A", quantity: 1 },
            offerB: { amountCents: BROKER_CREDIT_OFFERS.B.priceCents, offerType: "B", quantity: 10 },
            checkoutUrl: "/api/stripe/checkout",
          },
          { status: 402 }
        );
      }
    }

    const pdfUrl = `https://storage.lecipm.com/drafts/${draftId}.pdf`;

    const contentToHash = JSON.stringify(draft.resultJson);
    const hash = generateDraftHash(contentToHash);
    await storeDraftHash(draftId, hash, prisma);

    await logTurboDraftEvent({
      draftId,
      userId: auth.user.id,
      eventKey: "turbo_draft_exported",
      severity: "INFO",
      payload: { format: "PDF", hash, usedCredit: !legacyPaid },
    });

    return NextResponse.json({ success: true, pdfUrl, hash });
  } catch (err) {
    console.error("[api:turbo-draft:export] error", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
