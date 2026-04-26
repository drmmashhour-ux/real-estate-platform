import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireActiveResidentialBrokerLicence } from "@/lib/compliance/oaciq/broker-licence-guard";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createOfferDocument, type OfferTypeKey } from "@/modules/offers/services/offer-service";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { assertBrokeredTransaction } from "@/modules/legal-boundary/compliance-action-guard";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

export const dynamic = "force-dynamic";

function ip(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`offers:create:${ip(req)}`, { windowMs: 60_000, max: 20 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(limit) });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type = body?.type as string;
  if (type !== "purchase_offer" && type !== "rental_offer") {
    return NextResponse.json({ error: "type must be purchase_offer or rental_offer" }, { status: 400 });
  }

  if (user.role === PlatformRole.BROKER) {
    const licenceBlock = await requireActiveResidentialBrokerLicence(userId, {
      dealType: type === "purchase_offer" ? "residential_purchase_offer" : "residential_lease_offer",
      actorBrokerId: userId,
      assignedBrokerId: userId,
    });
    if (licenceBlock) return licenceBlock;
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (listingId) {
    const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: listingId });
    const boundaryBlock = await assertBrokeredTransaction(txCtx, "create_offer", userId, {
      auditAllowSuccess: true,
    });
    if (boundaryBlock) return boundaryBlock;
  }
  if (enforceableContractsRequired() && listingId) {
    const contractType =
      type === "rental_offer" ? ENFORCEABLE_CONTRACT_TYPES.RENTAL : ENFORCEABLE_CONTRACT_TYPES.BUYER;
    const signed = await hasActiveEnforceableContract(userId, contractType, { listingId });
    if (!signed) {
      return NextResponse.json(
        {
          error:
            type === "rental_offer"
              ? "Sign the rental agreement for this listing before creating a rental offer (ContractSign kind=rental)."
              : "Sign the buyer agreement for this listing before creating a purchase offer (ContractSign kind=buyer).",
          code: "ENFORCEABLE_CONTRACT_REQUIRED",
        },
        { status: 403 }
      );
    }
  }

  try {
    const result = await createOfferDocument({
      actorId: userId,
      actorRole: user.role,
      type: type as OfferTypeKey,
      listingId: listingId || null,
      leadId: typeof body.leadId === "string" ? body.leadId : null,
      body: typeof body.payload === "object" && body.payload ? body.payload : body,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
