import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { generateInvestorMemo } from "@/modules/investor/investor-memo.service";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";
import type { InvestorMemoType } from "@/modules/investor/investor.types";

export const dynamic = "force-dynamic";

const TAG = "[investor-memo]";

export async function POST(req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const allowed = await userCanAccessInvestorDocuments(userId, listingId);
  if (!allowed) {
    logInfo(`${TAG} forbidden`, { listingId, userId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let memoType: InvestorMemoType = "PRELIMINARY";
  try {
    const body = (await req.json()) as { memoType?: InvestorMemoType };
    if (
      body?.memoType &&
      ["PRELIMINARY", "ACQUISITION", "ESG", "INVESTMENT_UPDATE"].includes(body.memoType)
    ) {
      memoType = body.memoType;
    }
  } catch {
    /* empty body */
  }

  try {
    const result = await generateInvestorMemo({ listingId, userId, memoType });
    return NextResponse.json({
      ok: true,
      id: result.memo.id,
      payload: result.payload,
    });
  } catch (e) {
    logInfo(`${TAG} generate error`, { message: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Memo generation failed" }, { status: 500 });
  }
}
