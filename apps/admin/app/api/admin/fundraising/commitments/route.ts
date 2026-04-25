import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isInvestorCommitmentStatus } from "@/src/modules/fundraising/constants";
import { createInvestorCommitment, getOrCreateOpen100kRound } from "@/src/modules/fundraising/round";

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
  const b = body as {
    roundId?: string;
    investorId?: string;
    amount?: number;
    status?: string;
  };

  const investorId = typeof b.investorId === "string" ? b.investorId : "";
  const amount = typeof b.amount === "number" ? b.amount : Number(b.amount);
  const statusRaw = typeof b.status === "string" ? b.status : "interested";

  if (!investorId) return Response.json({ error: "investorId required" }, { status: 400 });
  if (!Number.isFinite(amount) || amount < 0) {
    return Response.json({ error: "valid amount required" }, { status: 400 });
  }
  if (!isInvestorCommitmentStatus(statusRaw)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  let roundId = typeof b.roundId === "string" && b.roundId ? b.roundId : "";
  if (!roundId) {
    const r = await getOrCreateOpen100kRound();
    roundId = r.id;
  }

  try {
    const row = await createInvestorCommitment(roundId, investorId, amount, statusRaw);
    return Response.json({
      id: row.id,
      roundId: row.roundId,
      investorId: row.investorId,
      amount: row.amount,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
