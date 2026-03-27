import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  isDealAnalyzerAutoRefreshEnabled,
  isDealAnalyzerCompsEnabled,
  isDealAnalyzerEnabled,
} from "@/modules/deal-analyzer/config";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { evaluateRefreshNeed } from "@/modules/deal-analyzer/application/evaluateRefreshNeed";
import { scheduleComparableRefresh } from "@/modules/deal-analyzer/application/scheduleComparableRefresh";
import { RefreshTriggerSource } from "@/modules/deal-analyzer/domain/refresh";
import { refreshPostBodySchema } from "@/modules/deal-analyzer/api/phase4Schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerCompsEnabled() || !isDealAnalyzerAutoRefreshEnabled()) {
    return NextResponse.json({ error: "Comparable refresh disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = refreshPostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const need = await evaluateRefreshNeed(id, { force: parsed.data.force === true });
  if (!need.shouldRefresh) {
    return NextResponse.json({ ok: false, reasons: need.reasons }, { status: 409 });
  }

  const out = await scheduleComparableRefresh({
    listingId: id,
    triggerSource: RefreshTriggerSource.MANUAL,
    runSync: true,
  });
  return NextResponse.json(out);
}
