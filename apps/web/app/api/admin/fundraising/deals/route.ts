import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isFundraisingDealStatus } from "@/src/modules/fundraising/constants";
import { createDeal } from "@/src/modules/fundraising/pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { investorId?: string; amount?: number; status?: string };
  const investorId = typeof b.investorId === "string" ? b.investorId : "";
  const amount = typeof b.amount === "number" ? b.amount : Number(b.amount);
  const status = typeof b.status === "string" ? b.status : "open";
  if (!investorId) return Response.json({ error: "investorId required" }, { status: 400 });
  if (!isFundraisingDealStatus(status)) return Response.json({ error: "invalid status" }, { status: 400 });

  try {
    const row = await createDeal(investorId, amount, status);
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
