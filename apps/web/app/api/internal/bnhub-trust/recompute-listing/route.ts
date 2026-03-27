import { NextRequest } from "next/server";
import { recomputeListingTrust } from "@/modules/bnhub-trust/services/listingRiskService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.BNHUB_TRUST_CRON_SECRET?.trim();
  const h = req.headers.get("x-bnhub-trust-cron")?.trim();
  if (!secret || h !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: { listingId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });
  await recomputeListingTrust(listingId);
  return Response.json({ ok: true });
}
