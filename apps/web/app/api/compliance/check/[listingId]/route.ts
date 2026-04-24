import { NextResponse } from "next/server";
import { complianceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import {
  buildOaciqBrokerageCheckPayload,
  loadOaciqBrokerageComplianceSlice,
} from "@/modules/legal/compliance/lecipm-oaciq-brokerage-forms.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await ctx.params;
  if (!listingId?.trim()) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!complianceFlags.lecipmOaciqBrokerageFormsEngineV1) {
    return NextResponse.json({
      contract_valid: false,
      declaration_signed: false,
      declaration_refused: false,
      identity_verified: false,
      disclosure_complete: false,
      form_version_valid: false,
      ready_for_transaction: false,
      distribution_authorization_survives: false,
      compliance_codes: ["FEATURE_DISABLED"],
    });
  }

  const slice = await loadOaciqBrokerageComplianceSlice(listingId);
  const payload = buildOaciqBrokerageCheckPayload(slice);
  return NextResponse.json(payload);
}
