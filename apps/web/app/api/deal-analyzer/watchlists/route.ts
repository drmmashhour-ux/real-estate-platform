import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { listWatchlistsForUserDto } from "@/modules/deal-analyzer/application/listWatchlists";
import { createWatchlist } from "@/modules/deal-analyzer/application/createWatchlist";
import { createWatchlistBodySchema } from "@/modules/deal-analyzer/api/phase3Schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await listWatchlistsForUserDto(userId);
  return NextResponse.json({ watchlists: rows ?? [] });
}

export async function POST(request: Request) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = createWatchlistBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const out = await createWatchlist({ userId, name: parsed.data.name });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });

  return NextResponse.json({
    watchlist: {
      id: out.watchlist.id,
      name: out.watchlist.name,
      itemCount: 0,
      createdAt: out.watchlist.createdAt.toISOString(),
      updatedAt: out.watchlist.updatedAt.toISOString(),
    },
  });
}
