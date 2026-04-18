import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNotarySystemV1 } from "@/lib/deals/pipeline-feature-guard";
import { matchNotaries } from "@/modules/notary/notary-matching.service";
import { listActiveNotaries } from "@/modules/notary/notary.service";

export const dynamic = "force-dynamic";

/** Ranked notary suggestions or full directory (no PII beyond directory fields). */
export async function GET(request: Request) {
  const gated = requireNotarySystemV1();
  if (gated) return gated;

  const dealId = new URL(request.url).searchParams.get("dealId");
  if (!dealId) {
    return Response.json({ error: "dealId query required for broker-scoped access" }, { status: 400 });
  }

  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const region = new URL(request.url).searchParams.get("region");
  const language = new URL(request.url).searchParams.get("language");

  if (region || language) {
    const ranked = await matchNotaries({
      region: region ?? undefined,
      languagePreference: language ?? undefined,
    });
    return Response.json({ notaries: ranked });
  }

  const all = await listActiveNotaries();
  return Response.json({ notaries: all });
}
