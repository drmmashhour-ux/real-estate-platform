import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { createToolLead } from "@/lib/leads/create-tool-lead";

export const dynamic = "force-dynamic";

/** Expert handoff — broker / mortgage / custom plan */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  const body = (await request.json().catch(() => null)) as {
    kind?: "broker" | "mortgage" | "plan";
    email?: string;
    name?: string;
    phone?: string;
    scenarioId?: string;
    listingIds?: string[];
    note?: string;
  } | null;
  if (!body?.email || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const scenario = body.scenarioId
    ? await prisma.portfolioScenario.findFirst({
        where: { id: body.scenarioId, userId: userId ?? undefined },
        include: { items: true },
      })
    : null;

  const lead = await createToolLead({
    leadType: "investor_portfolio_lead",
    name: body.name,
    email: body.email,
    phone: body.phone,
    city: scenario?.items[0]?.city ?? null,
    toolInputs: {
      kind: body.kind ?? "broker",
      scenarioId: body.scenarioId,
      listingIds: body.listingIds ?? scenario?.items.map((i) => i.listingId) ?? [],
      note: body.note ?? "",
    },
    toolOutputs: scenario
      ? {
          title: scenario.title,
          scenarioKind: scenario.scenarioKind,
          projectedAverageRoiPercent: scenario.projectedAverageRoiPercent,
        }
      : {},
  });

  if (userId) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { userId },
    });
  }

  void prisma.toolUsageEvent
    .create({
      data: {
        toolKey: "investor_portfolio",
        eventType: body.kind === "mortgage" ? "cta_mortgage" : "cta_broker",
        userId: userId ?? undefined,
        payloadJson: { leadId: lead.id, kind: body.kind },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, leadId: lead.id, label: "estimate" });
}
