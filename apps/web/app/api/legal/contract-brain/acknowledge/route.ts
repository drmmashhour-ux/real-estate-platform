import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { acknowledgeContractBrainNotice } from "@/lib/legal/contract-brain-engine";
import { canAccessContract, getContractForAccess, resolveListingOwnerId } from "@/modules/contracts/services/access";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  if (!raw || raw === "anonymous") return null;
  return raw;
}

type Body = {
  contractId?: string;
  userId?: string;
  noticeKey?: string;
};

/**
 * POST /api/legal/contract-brain/acknowledge
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
  const noticeKey = typeof body.noticeKey === "string" ? body.noticeKey.trim() : "";
  if (!contractId || !userId || !noticeKey) {
    return NextResponse.json({ error: "contractId, userId, and noticeKey required" }, { status: 400 });
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

  const ua = req.headers.get("user-agent");
  const result = await acknowledgeContractBrainNotice({
    contractId,
    userId,
    noticeKey,
    ipAddress: clientIp(req),
    userAgent: ua,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
