import { NextResponse } from "next/server";
import { ComplianceCaseSeverity, ComplianceCaseType, ComplianceFormAction, ComplianceFormEntityType, OaciqMandatoryFormVersion } from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@/lib/db";
import {
  freezeListingForOaciqRefusal,
  logComplianceFormEvent,
} from "@/modules/legal/compliance/lecipm-oaciq-brokerage-forms.service";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  sellerId?: string;
  refusalReason?: string;
};

export async function POST(req: Request) {
  if (!complianceFlags.lecipmOaciqBrokerageFormsEngineV1) {
    return NextResponse.json({ error: "FEATURE_DISABLED" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = body.listingId?.trim();
  const sellerId = body.sellerId?.trim();
  if (!listingId || !sellerId) {
    return NextResponse.json({ error: "listingId and sellerId required" }, { status: 400 });
  }

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const row = await prisma.lecipmCrmOaciqSellerDeclaration.upsert({
    where: { listingId_sellerId: { listingId, sellerId } },
    create: {
      listingId,
      sellerId,
      formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
      completed: false,
      signed: false,
      refused: true,
      refusalReason: body.refusalReason?.slice(0, 4000) ?? null,
      submittedAt: now,
    },
    update: {
      refused: true,
      completed: false,
      signed: false,
      refusalReason: body.refusalReason?.slice(0, 4000) ?? null,
      submittedAt: now,
    },
    select: { id: true },
  });

  await freezeListingForOaciqRefusal(listingId, "DECLARATION_REFUSED");

  await logComplianceFormEvent(prisma, {
    entityType: ComplianceFormEntityType.declaration,
    entityId: row.id,
    action: ComplianceFormAction.refused,
    performedByUserId: userId,
    notes: body.refusalReason ?? null,
  });

  logComplianceEvent("OACIQ_SELLER_DECLARATION_REFUSED", { listingId, sellerId, declarationId: row.id });

  await prisma.complianceCase.create({
    data: {
      listingId,
      caseType: ComplianceCaseType.representation_risk,
      severity: ComplianceCaseSeverity.high,
      summary: "Seller refused OACIQ seller declaration — listing frozen (LECIPM brokerage forms engine).",
      findings: { source: "lecipm_oaciq_brokerage_forms", declarationId: row.id },
      openedBySystem: true,
    },
  });

  return NextResponse.json({ ok: true, declarationId: row.id, listingFrozen: true });
}
