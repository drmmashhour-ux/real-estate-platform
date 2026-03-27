import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerAutoRefreshEnabled, isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { buildRefreshStatusDto } from "@/modules/deal-analyzer/infrastructure/mappers/phase4DtoMappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAutoRefreshEnabled()) {
    return NextResponse.json({ error: "Comparable refresh disabled" }, { status: 503 });
  }
  const { id } = await context.params;
  const userId = await getGuestId();
  const gate = await assertFsboListingAccessibleForPhase3(id, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dto = await buildRefreshStatusDto(id);
  return NextResponse.json({ refreshStatus: dto });
}
