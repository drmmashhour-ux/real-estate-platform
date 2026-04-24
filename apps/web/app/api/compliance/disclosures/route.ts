import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { ComplianceDisclosureService } from "@/lib/compliance/compliance-disclosure.service";

export async function GET(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      const contexts = ["DEAL", "FUND", "ESG", "AI_RECOMMENDATION"] as const;
      const disclosures = await Promise.all(
        contexts.map(async (ctx) => {
          const disc = await ComplianceDisclosureService.getLatestDisclosure(ctx as any);
          const accepted = await ComplianceDisclosureService.hasAcceptedLatest(userId, ctx as any);
          return { context: ctx, disclosure: disc, accepted };
        })
      );
      return NextResponse.json({ ok: true, disclosures });
    }
  });
}

export async function POST(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "MANAGE_USER_PROFILE",
    handler: async (userId) => {
      const body = await req.json();
      const { disclosureId } = body;
      const acceptance = await ComplianceDisclosureService.acceptDisclosure(userId, disclosureId);
      return NextResponse.json({ ok: true, acceptance });
    }
  });
}
