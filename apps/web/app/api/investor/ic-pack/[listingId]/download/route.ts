import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { getLatestInvestorIcPack } from "@/modules/investor/investor-ic-pack.service";
import { renderInvestorIcPackPdf } from "@/modules/investor/investor-pdf-builder.service";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import type { InvestorIcPackPayload } from "@/modules/investor/investor.types";

export const dynamic = "force-dynamic";

const TAG = "[investor-pdf]";

export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const allowed = await userCanAccessInvestorDocuments(userId, listingId);
  if (!allowed) {
    logInfo(`${TAG} forbidden ic pdf`, { listingId, userId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pack = await getLatestInvestorIcPack(listingId);
  if (!pack) return NextResponse.json({ error: "No IC pack generated yet" }, { status: 404 });

  try {
    const payload = pack.payloadJson as InvestorIcPackPayload;
    const pdf = await renderInvestorIcPackPdf(payload);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="investor-ic-pack-${listingId}-${date}.pdf"`,
      },
    });
  } catch {
    logInfo(`${TAG} ic pdf failed`, { listingId });
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
