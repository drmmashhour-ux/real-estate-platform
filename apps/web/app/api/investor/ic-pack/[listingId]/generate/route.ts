import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { generateInvestorIcPack } from "@/modules/investor/investor-ic-pack.service";
import { userCanAccessInvestorDocuments } from "@/modules/investor/investor-permissions";

export const dynamic = "force-dynamic";

const TAG = "[investor-ic-pack]";

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

  let decisionStage: string | undefined;
  try {
    const body = (await req.json()) as { decisionStage?: string };
    decisionStage = body?.decisionStage?.trim() || undefined;
  } catch {
    /* empty */
  }

  try {
    const result = await generateInvestorIcPack({ listingId, userId, decisionStage });
    return NextResponse.json({
      ok: true,
      id: result.icPack.id,
      payload: result.payload,
    });
  } catch (e) {
    logInfo(`${TAG} generate error`, { message: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "IC pack generation failed" }, { status: 500 });
  }
}
