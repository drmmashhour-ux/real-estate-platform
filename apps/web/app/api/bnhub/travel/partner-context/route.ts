import {
  getTravelPartnerDisclosure,
  getTravelPartnerLinks,
  getTravelAiStaysCtaPath,
} from "@/lib/bnhub/travel-partner-config";
import { isOpenAiConfigured } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

/** Public: partner deep links from env + disclosure copy for the travel AI hub. */
export async function GET() {
  return Response.json({
    partnerLinks: getTravelPartnerLinks(),
    disclosure: getTravelPartnerDisclosure(),
    staysPath: getTravelAiStaysCtaPath(),
    aiTravelAssistantEnabled: isOpenAiConfigured(),
  });
}
