import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  generateRetrofitPlansForListing,
  ensureRetrofitAccess,
  type RetrofitStrategyType,
} from "@/modules/esg/esg-retrofit-planner.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg-retrofit]";

export async function POST(req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await ensureRetrofitAccess(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let strategies: RetrofitStrategyType[] | undefined;
  try {
    const j = (await req.json()) as { strategies?: RetrofitStrategyType[] };
    if (Array.isArray(j.strategies) && j.strategies.length > 0) strategies = j.strategies;
  } catch {
    /* empty body */
  }

  try {
    const result = await generateRetrofitPlansForListing(listingId, strategies);
    logInfo(`${TAG} generate-api`, { listingId, ...result });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Retrofit generation failed" }, { status: 500 });
  }
}
