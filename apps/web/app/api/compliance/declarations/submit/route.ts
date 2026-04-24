import { NextResponse } from "next/server";
import { ComplianceFormAction, ComplianceFormEntityType, OaciqMandatoryFormVersion } from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@/lib/db";
import {
  logComplianceFormEvent,
} from "@/modules/legal/compliance/lecipm-oaciq-brokerage-forms.service";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  sellerId?: string;
  formVersion?: string;
  completed?: boolean;
  signed?: boolean;
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

  if (body.formVersion !== OaciqMandatoryFormVersion.REFORM_2022_MANDATORY) {
    return NextResponse.json({ error: "INVALID_FORM_VERSION" }, { status: 422 });
  }

  if (!body.completed) {
    return NextResponse.json({ error: "DECLARATION_INCOMPLETE" }, { status: 422 });
  }

  const existing = await prisma.lecipmCrmOaciqSellerDeclaration.findUnique({
    where: { listingId_sellerId: { listingId, sellerId } },
    select: { id: true, refused: true },
  });
  if (existing?.refused) {
    return NextResponse.json({ error: "DECLARATION_REFUSED_BLOCK" }, { status: 403 });
  }

  const now = new Date();
  const row = await prisma.lecipmCrmOaciqSellerDeclaration.upsert({
    where: { listingId_sellerId: { listingId, sellerId } },
    create: {
      listingId,
      sellerId,
      formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
      completed: true,
      signed: Boolean(body.signed),
      refused: false,
      submittedAt: now,
      signedAt: body.signed ? now : null,
    },
    update: {
      formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
      completed: true,
      signed: Boolean(body.signed),
      refused: false,
      refusalReason: null,
      submittedAt: now,
      signedAt: body.signed ? now : null,
    },
    select: { id: true },
  });

  await logComplianceFormEvent(prisma, {
    entityType: ComplianceFormEntityType.declaration,
    entityId: row.id,
    action: body.signed ? ComplianceFormAction.signed : ComplianceFormAction.updated,
    performedByUserId: userId,
    notes: "seller_declaration_submit",
  });

  return NextResponse.json({ ok: true, declarationId: row.id });
}
