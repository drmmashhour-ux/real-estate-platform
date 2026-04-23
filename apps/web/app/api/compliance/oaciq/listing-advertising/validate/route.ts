import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { buildListingAdvertisingComplianceContext } from "@/lib/compliance/oaciq/representation-advertising/context-builder";
import { validateListingAdvertisingCompliance } from "@/lib/compliance/oaciq/representation-advertising/engine";
import { DEFAULT_PUBLISH_RULE_SUBSET } from "@/lib/compliance/oaciq/representation-advertising/rules";

export const dynamic = "force-dynamic";

/** POST — dry-run OACIQ advertising / representation compliance (broker-only). */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const brokerUserId = auth.user.role === PlatformRole.ADMIN && typeof body.brokerUserId === "string"
    ? body.brokerUserId.trim()
    : auth.user.id;

  const ok = await canAccessCrmListingCompliance(brokerUserId, listingId);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ctx = await buildListingAdvertisingComplianceContext(listingId, brokerUserId, {
      intendedForPublicAdvertising:
        typeof body.intendedForPublicAdvertising === "boolean" ? body.intendedForPublicAdvertising : true,
    });
    const evaluation = validateListingAdvertisingCompliance(ctx, DEFAULT_PUBLISH_RULE_SUBSET);
    return NextResponse.json({
      success: true,
      evaluation,
      context_preview: {
        intendedForPublicAdvertising: ctx.intendedForPublicAdvertising,
        isComingSoonOrTeaser: ctx.isComingSoonOrTeaser,
        isSoldOrCompleted: ctx.isSoldOrCompleted,
        broker: ctx.broker,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "LISTING_NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
