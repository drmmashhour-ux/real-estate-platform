import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { getBrokerGrowthGoals, upsertBrokerGrowthGoals } from "@/modules/broker-growth-coach/growth-coach.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerGrowthCoachV1) {
    return Response.json({ error: "Growth coach disabled" }, { status: 403 });
  }
  const goals = await getBrokerGrowthGoals(session.userId);
  return Response.json({ goals });
}

export async function POST(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerGrowthCoachV1) {
    return Response.json({ error: "Growth coach disabled" }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const goals = await upsertBrokerGrowthGoals(session.userId, {
    monthlyLeadTarget: num(body.monthlyLeadTarget),
    monthlyClosingTarget: num(body.monthlyClosingTarget),
    responseTimeHoursTarget: num(body.responseTimeHoursTarget),
    listingConversionRateTarget: num(body.listingConversionRateTarget),
    followUpDisciplineTarget: num(body.followUpDisciplineTarget),
  });

  return Response.json({ goals });
}

function num(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
}
