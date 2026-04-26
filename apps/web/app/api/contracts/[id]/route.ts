import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canAccessContract, getContractForAccess, resolveListingOwnerId } from "@/modules/contracts/services/access";
import { E_SIGN_CONTRACT_TYPES } from "@/lib/hubs/contract-types";
import { evaluateContractBrainSignatureGate } from "@/lib/legal/contract-brain-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/contracts/[id] — JSON for contract viewer (participants only).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const c = await getContractForAccess(id);
  if (!c || !E_SIGN_CONTRACT_TYPES.has(c.type)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const listingOwnerId = await resolveListingOwnerId(c);
  if (!canAccessContract(userId, user.role, c, listingOwnerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pendingSig =
    c.signatures.find((s) => !s.signedAt && (s.userId === userId || s.email.toLowerCase() === user.email.toLowerCase())) ??
    null;

  const marketplaceSimpleTypes = new Set([
    "SELLER_AGREEMENT",
    "PLATFORM_TERMS",
    "HOST_AGREEMENT",
    "RENTAL_AGREEMENT",
    "BROKER_AGREEMENT",
    "BROKER_COLLABORATION",
  ]);
  const marketplaceSimpleSign =
    marketplaceSimpleTypes.has(c.type) && c.status === "pending" && c.userId === userId;

  let baseCanSign = Boolean(pendingSig) || marketplaceSimpleSign;
  if (baseCanSign) {
    const brain = await evaluateContractBrainSignatureGate({
      contractId: c.id,
      userId,
      contractContent: c.content,
    });
    baseCanSign = brain.canSign;
  }

  return NextResponse.json({
    id: c.id,
    title: c.title,
    status: c.status,
    type: c.type,
    contentHtml: c.contentHtml,
    bookingId: c.bookingId,
    fsboListingId: c.fsboListingId ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    signedAt: c.signedAt?.toISOString() ?? null,
    signatures: c.signatures.map((s) => ({
      id: s.id,
      role: s.role,
      name: s.name,
      email: s.email,
      signedAt: s.signedAt?.toISOString() ?? null,
      isViewer: s.userId === userId || s.email.toLowerCase() === user.email.toLowerCase(),
    })),
    marketplaceSimpleSign,
    canSign: baseCanSign,
    pendingRole: pendingSig?.role ?? null,
  });
}
