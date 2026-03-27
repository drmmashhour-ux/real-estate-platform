import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { deleteOfferScenario } from "@/src/modules/offer-strategy-simulator/application/deleteOfferScenario";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? "";
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId query required" }, { status: 400 });
  }

  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await deleteOfferScenario({ userId, scenarioId: id, propertyId });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 404 });

  return NextResponse.json({ ok: true });
}
