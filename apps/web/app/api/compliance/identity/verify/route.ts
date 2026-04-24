import { NextResponse } from "next/server";
import {
  ComplianceFormAction,
  ComplianceFormEntityType,
  type LecipmIdentityProofMethod,
  type LecipmIdentityProofVisibility,
} from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@/lib/db";
import { logComplianceFormEvent } from "@/modules/legal/compliance/lecipm-oaciq-brokerage-forms.service";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  sellerUserId?: string;
  verificationMethod?: string;
  documentType?: string;
  documentReferenceHash?: string;
  visibleTo?: string;
};

function parseVis(raw: string | undefined): LecipmIdentityProofVisibility {
  if (raw === "compliance_only") return "compliance_only";
  return "broker_only";
}

function parseMethod(raw: string | undefined): LecipmIdentityProofMethod {
  if (raw === "remote") return "remote";
  return "in_person";
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
  const sellerUserId = body.sellerUserId?.trim();
  const documentType = body.documentType?.trim();
  const documentReferenceHash = body.documentReferenceHash?.trim();
  if (!listingId || !sellerUserId || !documentType || !documentReferenceHash) {
    return NextResponse.json(
      { error: "listingId, sellerUserId, documentType, documentReferenceHash required" },
      { status: 400 },
    );
  }

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const verifiedAt = new Date();
  const row = await prisma.lecipmBrokerageIdentityProof.upsert({
    where: {
      listingId_sellerUserId: { listingId, sellerUserId },
    },
    create: {
      listingId,
      sellerUserId,
      verifiedByBrokerId: userId,
      verificationMethod: parseMethod(body.verificationMethod),
      documentType: documentType.slice(0, 64),
      documentReferenceHash: documentReferenceHash.slice(0, 128),
      verifiedAt,
      confidential: true,
      visibleTo: parseVis(body.visibleTo),
      attachableToTransactionDocuments: false,
    },
    update: {
      verifiedByBrokerId: userId,
      verificationMethod: parseMethod(body.verificationMethod),
      documentType: documentType.slice(0, 64),
      documentReferenceHash: documentReferenceHash.slice(0, 128),
      verifiedAt,
      visibleTo: parseVis(body.visibleTo),
      attachableToTransactionDocuments: false,
    },
    select: { id: true },
  });

  await logComplianceFormEvent(prisma, {
    entityType: ComplianceFormEntityType.identity,
    entityId: row.id,
    action: ComplianceFormAction.validated,
    performedByUserId: userId,
    notes: "brokerage_identity_proof",
  });

  return NextResponse.json({ ok: true, identityProofId: row.id, attachableToTransactionDocuments: false });
}
