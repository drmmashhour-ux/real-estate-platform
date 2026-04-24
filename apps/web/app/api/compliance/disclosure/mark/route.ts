import { NextResponse } from "next/server";
import { ComplianceFormAction, ComplianceFormEntityType, type DeclarationDisclosureMethod } from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@/lib/db";
import { logComplianceFormEvent } from "@/modules/legal/compliance/lecipm-oaciq-brokerage-forms.service";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  declarationId?: string;
  disclosedToBuyer?: boolean;
  disclosureMethod?: string;
  buyerUserId?: string | null;
};

function parseMethod(raw: string | undefined): DeclarationDisclosureMethod | null {
  if (raw === "auto") return "auto";
  if (raw === "broker_manual") return "broker_manual";
  return null;
}

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
  const declarationId = body.declarationId?.trim();
  if (!listingId || !declarationId) {
    return NextResponse.json({ error: "listingId and declarationId required" }, { status: 400 });
  }

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dec = await prisma.lecipmCrmOaciqSellerDeclaration.findFirst({
    where: { id: declarationId, listingId },
    select: { id: true },
  });
  if (!dec) return NextResponse.json({ error: "Declaration not found" }, { status: 404 });

  const ts = new Date();
  const row = await prisma.lecipmDeclarationDisclosure.upsert({
    where: { declarationId },
    create: {
      listingId,
      declarationId,
      disclosedToBuyer: Boolean(body.disclosedToBuyer),
      disclosureTimestamp: body.disclosedToBuyer ? ts : null,
      disclosureMethod: parseMethod(body.disclosureMethod),
      buyerUserId: body.buyerUserId?.trim() || null,
    },
    update: {
      disclosedToBuyer: Boolean(body.disclosedToBuyer),
      disclosureTimestamp: body.disclosedToBuyer ? ts : null,
      disclosureMethod: parseMethod(body.disclosureMethod) ?? undefined,
      buyerUserId: body.buyerUserId === undefined ? undefined : body.buyerUserId?.trim() || null,
    },
    select: { id: true },
  });

  await logComplianceFormEvent(prisma, {
    entityType: ComplianceFormEntityType.declaration,
    entityId: declarationId,
    action: ComplianceFormAction.updated,
    performedByUserId: userId,
    notes: `disclosure_mark:${Boolean(body.disclosedToBuyer)}`,
  });

  return NextResponse.json({ ok: true, disclosureId: row.id });
}
