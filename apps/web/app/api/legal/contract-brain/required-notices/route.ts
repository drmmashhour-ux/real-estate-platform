import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getContractBrainNoticeDefinition } from "@/lib/legal/contract-brain-notices";
import { logContractBrain } from "@/lib/legal/contract-brain-logger";
import { resolveRequiredNoticeKeysForEvaluation } from "@/lib/legal/contract-brain-engine";
import type { ContractBrainContext } from "@/lib/legal/contract-brain-types";
import { canAccessContract, getContractForAccess, resolveListingOwnerId } from "@/modules/contracts/services/access";

export const dynamic = "force-dynamic";

type Body = {
  contractId?: string;
  userId?: string;
  context?: ContractBrainContext;
};

/**
 * POST /api/legal/contract-brain/required-notices
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

  const keys = resolveRequiredNoticeKeysForEvaluation(c.content, body.context);
  const notices = keys
    .map((k) => getContractBrainNoticeDefinition(k))
    .filter((n): n is NonNullable<typeof n> => n != null)
    .map((n) => ({
      key: n.key,
      version: n.version,
      title: n.title,
      bodyFr: n.bodyFr,
      category: n.category,
      requiredWhen: n.requiredWhen,
    }));

  logContractBrain("required_notices_calculated", {
    contractId,
    userId,
    keys,
    context: body.context ?? null,
  });

  return NextResponse.json({ notices, noticeKeys: keys });
}
