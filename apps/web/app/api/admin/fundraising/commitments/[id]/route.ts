import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isInvestorCommitmentStatus } from "@/src/modules/fundraising/constants";
import { updateInvestorCommitment } from "@/src/modules/fundraising/round";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { status?: string; amount?: number };

  const patch: { status?: "interested" | "committed" | "transferred"; amount?: number } = {};
  if (b.status !== undefined) {
    if (!isInvestorCommitmentStatus(b.status)) {
      return Response.json({ error: "invalid status" }, { status: 400 });
    }
    patch.status = b.status;
  }
  if (b.amount !== undefined) {
    const amt = typeof b.amount === "number" ? b.amount : Number(b.amount);
    if (!Number.isFinite(amt) || amt < 0) {
      return Response.json({ error: "valid amount required" }, { status: 400 });
    }
    patch.amount = amt;
  }
  if (patch.status === undefined && patch.amount === undefined) {
    return Response.json({ error: "status or amount required" }, { status: 400 });
  }

  try {
    const row = await updateInvestorCommitment(id, patch);
    return Response.json({
      id: row.id,
      roundId: row.roundId,
      investorId: row.investorId,
      amount: row.amount,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    const status = msg.includes("not found") ? 404 : 400;
    return Response.json({ error: msg }, { status });
  }
}
