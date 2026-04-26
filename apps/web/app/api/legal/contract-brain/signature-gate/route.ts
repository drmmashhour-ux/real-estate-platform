import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  evaluateContractBrainSignatureGate,
  persistSignatureGateCheck,
} from "@/lib/legal/contract-brain-engine";
import type { ContractBrainContext } from "@/lib/legal/contract-brain-types";
import { canAccessContract, getContractForAccess, resolveListingOwnerId } from "@/modules/contracts/services/access";

export const dynamic = "force-dynamic";

type Body = {
  contractId?: string;
  userId?: string;
  context?: ContractBrainContext;
};

/**
 * POST /api/legal/contract-brain/signature-gate
 */
export async function POST(req: NextRequest) {
  const sessionUserId = await getGuestId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contractId = typeof body.contractId === "string" ? body.contractId.trim() : "";
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!contractId || !userId) {
    return NextResponse.json({ error: "contractId and userId required" }, { status: 400 });
  }
  if (userId !== sessionUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const c = await getContractForAccess(contractId);
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const listingOwnerId = await resolveListingOwnerId(c);
  if (!canAccessContract(sessionUserId, user.role, c, listingOwnerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await evaluateContractBrainSignatureGate({
    contractId,
    userId,
    contractContent: c.content,
    context: body.context,
  });

  await persistSignatureGateCheck({ contractId, userId, result });

  return NextResponse.json({
    canSign: result.canSign,
    missingNotices: result.missingNotices,
    reason: result.reason,
  });
}
