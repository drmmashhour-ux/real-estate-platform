import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { buildAndPersistMarketSnapshot, getMarketPulseForApi } from "@/lib/market/snapshot";

export const dynamic = "force-dynamic";

/** GET — live pulse + trends (no DB write; safe for polling). */
export async function GET(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const pulse = await getMarketPulseForApi();
    return NextResponse.json({ success: true, ...pulse, persisted: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Market pulse failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** POST — persist a snapshot row + traffic-spike alert evaluation. */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { snapshot, trends } = await buildAndPersistMarketSnapshot();
    const pulse = await getMarketPulseForApi();
    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        date: snapshot.date.toISOString(),
        visitorsCount: snapshot.visitorsCount,
        reservationsCount: snapshot.reservationsCount,
        listingsCount: snapshot.listingsCount,
        soldCount: snapshot.soldCount,
        dealsDetected: snapshot.dealsDetected,
        buyBoxMatches: snapshot.buyBoxMatches,
        source: snapshot.source,
        metadata: snapshot.metadata,
        createdAt: snapshot.createdAt.toISOString(),
      },
      trends,
      dataScopeLabel: pulse.dataScopeLabel,
      scopeNote: pulse.scopeNote,
      persisted: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Snapshot failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
