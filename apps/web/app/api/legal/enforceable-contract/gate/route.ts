import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import type { EnforceableContractType } from "@/lib/legal/enforceable-contract-types";

export const dynamic = "force-dynamic";

/**
 * GET — whether the current user satisfies an enforceable gate (for UI before calling gated APIs).
 * Query: action = publish_fsbo | offer | booking | publish_bnhub | broker | mortgage_unlock
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ ok: false, signed: false, error: "Sign in required" }, { status: 401 });
  }

  if (!enforceableContractsRequired()) {
    return NextResponse.json({ ok: true, signed: true, enforcementOff: true });
  }

  const { searchParams } = new URL(request.url);
  const action = (searchParams.get("action") ?? "").trim();
  const listingId = (searchParams.get("listingId") ?? "").trim();
  const fsboListingId = (searchParams.get("fsboListingId") ?? "").trim();

  let type: EnforceableContractType;
  const ctx: { fsboListingId?: string | null; listingId?: string | null } = {};

  switch (action) {
    case "publish_fsbo":
      type = ENFORCEABLE_CONTRACT_TYPES.SELLER;
      ctx.fsboListingId = fsboListingId || null;
      break;
    case "offer":
    case "buyer_offer":
      type = ENFORCEABLE_CONTRACT_TYPES.BUYER;
      ctx.listingId = listingId || null;
      break;
    case "booking":
    case "bnhub_booking":
      type = ENFORCEABLE_CONTRACT_TYPES.SHORT_TERM;
      ctx.listingId = listingId || null;
      break;
    case "publish_bnhub":
    case "host_publish":
      type = ENFORCEABLE_CONTRACT_TYPES.HOST;
      ctx.listingId = listingId || null;
      break;
    case "broker":
    case "mortgage_unlock":
      type = ENFORCEABLE_CONTRACT_TYPES.BROKER;
      break;
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  const needsListing =
    action === "offer" ||
    action === "buyer_offer" ||
    action === "booking" ||
    action === "bnhub_booking" ||
    action === "publish_bnhub" ||
    action === "host_publish";
  if ((action === "publish_fsbo" && !fsboListingId) || (needsListing && !listingId)) {
    return NextResponse.json(
      { ok: false, signed: false, error: "listingId or fsboListingId required for this action" },
      { status: 400 }
    );
  }

  const signed = await hasActiveEnforceableContract(userId, type, ctx);
  return NextResponse.json({ ok: true, signed, action, contractType: type });
}
