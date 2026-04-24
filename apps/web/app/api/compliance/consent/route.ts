import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { ComplianceConsentService } from "@/lib/compliance/compliance-consent.service";

export async function POST(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "MANAGE_USER_PROFILE",
    handler: async (userId) => {
      const body = await req.json();
      const { consentType, granted } = body;
      
      let result;
      if (granted) {
        result = await ComplianceConsentService.grantConsent(userId, consentType);
      } else {
        result = await ComplianceConsentService.revokeConsent(userId, consentType);
      }
      
      return NextResponse.json({ ok: true, result });
    }
  });
}

export async function GET(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      const { prisma } = await import("@/lib/db");
      const consents = await prisma.lecipmRegulatoryConsent.findMany({
        where: { userId }
      });
      return NextResponse.json({ ok: true, consents });
    }
  });
}
