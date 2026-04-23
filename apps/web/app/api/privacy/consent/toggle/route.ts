import { NextResponse } from "next/server";
import { PrivacyConsentService } from "@/modules/privacy/services/privacy-consent.service";
import { PrivacyPurpose } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId, purpose, granted } = await req.json();

    if (!userId || !purpose) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (granted) {
      await PrivacyConsentService.grantConsent({
        userId,
        purpose: purpose as PrivacyPurpose,
        scopeText: `User toggled ${purpose} to GRANTED via Privacy Center.`,
        explicit: true,
        written: false,
        legalBasisText: "Explicit user consent via platform interface.",
      });
    } else {
      await PrivacyConsentService.revokeConsent({
        userId,
        purpose: purpose as PrivacyPurpose,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
