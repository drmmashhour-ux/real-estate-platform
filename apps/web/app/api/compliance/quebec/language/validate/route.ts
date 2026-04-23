import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { complianceFlags } from "@/config/feature-flags";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { validateQuebecLanguageForListingPublish } from "@/lib/compliance/quebec/listing-quebec-compliance-publish.service";
import {
  validateFrenchPublicListingContent,
  validateResidentialScopeForPublish,
} from "@/lib/compliance/quebec/language-compliance.guard";
import type { ListingPublicLanguageInput } from "@/lib/compliance/quebec/language-compliance.guard";

export const dynamic = "force-dynamic";

/** POST — dry-run Québec language + residential scope (broker/admin). */
export async function POST(req: Request) {
  if (!complianceFlags.quebecLanguageComplianceV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

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
  if (listingId) {
    const brokerUserId =
      auth.user.role === PlatformRole.ADMIN && typeof body.brokerUserId === "string"
        ? body.brokerUserId.trim()
        : auth.user.id;
    const ok = await canAccessCrmListingCompliance(brokerUserId, listingId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    try {
      const evaluation = await validateQuebecLanguageForListingPublish(listingId, brokerUserId);
      return NextResponse.json({ success: true, evaluation });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      if (msg === "LISTING_NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const draft = body.listing as Record<string, unknown> | undefined;
  if (draft && typeof draft.title === "string") {
    const listing: ListingPublicLanguageInput = {
      title: draft.title,
      titleFr: typeof draft.titleFr === "string" ? draft.titleFr : null,
      assistantDraftContent: draft.assistantDraftContent,
    };
    const lang = validateFrenchPublicListingContent(listing);
    const scope = validateResidentialScopeForPublish({
      marketingText: [listing.title, listing.titleFr ?? "", JSON.stringify(listing.assistantDraftContent ?? "")].join(
        "\n",
      ),
      licenceType: typeof body.licenceType === "string" ? body.licenceType : "residential",
    });
    const violations = [...lang.violations, ...scope.violations];
    return NextResponse.json({
      success: true,
      evaluation: {
        compliant: violations.length === 0,
        blockPublish: violations.length > 0,
        violations,
        policy: { requireFrenchForPublicContent: true },
      },
    });
  }

  return NextResponse.json({ error: "listingId or listing object required" }, { status: 400 });
}
