import { getBrokerIntelligence } from "@/lib/broker/intelligence";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/broker/intelligence?brokerId=
 * `brokerId` must match the signed-in user (the broker) — operational insights for their CRM listings.
 */
export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brokerId = searchParams.get("brokerId");
  if (!brokerId) {
    return Response.json({ error: "brokerId required" }, { status: 400 });
  }
  if (brokerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(await getBrokerIntelligence(brokerId));
}
