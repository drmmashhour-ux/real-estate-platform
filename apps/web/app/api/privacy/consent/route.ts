import { NextResponse } from "next/server";
import { PrivacyConsentService } from "@/modules/privacy/services/privacy-consent.service";
import { PrivacyPurpose } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, transactionId, purpose, legalName, role, acknowledged } = body;

    if (!userId || !acknowledged || !legalName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = await PrivacyConsentService.grantConsent({
      userId,
      transactionId,
      purpose: (purpose as PrivacyPurpose) || PrivacyPurpose.TRANSACTION_EXECUTION,
      scopeText: `Privacy, Consent and Information Handling Acknowledgement signed as ${role}. Legal Name: ${legalName}.`,
      explicit: true,
      written: true,
      legalBasisText: "Law 25 (Québec) and OACIQ standards compliance.",
      createdBy: userId,
    });

    return NextResponse.json({ success: true, recordId: record.id });
  } catch (error: any) {
    console.error("Privacy consent error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
