import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { getLatestInvestorMemo } from "@/modules/investor/investor-memo.service";
import { renderInvestorMemoPdf } from "@/modules/investor/investor-pdf-builder.service";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import type { InvestorMemoPayload } from "@/modules/investor/investor.types";

export const dynamic = "force-dynamic";

const TAG = "[investor-pdf]";

export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const allowed = await userCanAccessInvestorDocuments(userId, listingId);
  if (!allowed) {
    logInfo(`${TAG} forbidden memo pdf`, { listingId, userId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const memo = await getLatestInvestorMemo(listingId);
  if (!memo) return NextResponse.json({ error: "No memo generated yet" }, { status: 404 });

  try {
    const payload = memo.payloadJson as InvestorMemoPayload;
    const pdf = await renderInvestorMemoPdf(payload);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="investor-memo-${listingId}-${date}.pdf"`,
      },
    });
  } catch {
    logInfo(`${TAG} memo pdf failed`, { listingId });
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
