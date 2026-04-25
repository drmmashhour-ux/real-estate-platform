import { NextResponse } from "next/server";
import { LecipmCrmContactType, LecipmCrmPipelineLeadStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordBrokerDemoEvent } from "@/modules/growth/broker-demo-metrics.service";
import { BROKER_DEMO_DEALS } from "@/modules/growth/demo-sample-data";

export const dynamic = "force-dynamic";

const DEMO_PACK = "broker_3min_v1" as const;

/**
 * Seeds three CRM pipeline rows for the current broker so the demo promise shows up in-product.
 * Idempotent per broker: skips if demo pack already exists.
 */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "BROKER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.lecipmCrmPipelineLead.findFirst({
    where: {
      brokerId: userId,
      metadata: { path: ["demoPack"], equals: DEMO_PACK },
    },
  });

  if (existing) {
    await recordBrokerDemoEvent({
      action: "assign_sample_leads",
      userEmail: user.email,
      extra: { alreadyAssigned: true },
    });
    return NextResponse.json({
      ok: true,
      alreadyAssigned: true,
      count: BROKER_DEMO_DEALS.length,
    });
  }

  const rows: { contactId: string; leadId: string }[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      for (const deal of BROKER_DEMO_DEALS) {
        const contact = await tx.lecipmCrmContact.create({
          data: {
            brokerId: userId,
            contactType: LecipmCrmContactType.lead,
            fullName: deal.label,
            source: "demo_3min",
            stage: "new",
            notes: [
              {
                at: new Date().toISOString(),
                text: `Sample from 3-min broker demo · ${deal.area} · id ${deal.id}. Replace with real data anytime.`,
              },
            ] as object,
          },
        });

        const status =
          deal.pipelineLabel === "Offer" || deal.pipelineLabel === "Closing" ?
            LecipmCrmPipelineLeadStatus.hot
          : deal.pipelineLabel === "Qualified" ? LecipmCrmPipelineLeadStatus.warm
          : LecipmCrmPipelineLeadStatus.new;

        const pl = await tx.lecipmCrmPipelineLead.create({
          data: {
            brokerId: userId,
            contactId: contact.id,
            leadType: "residential",
            source: "demo_3min",
            intentLevel: "buy",
            status,
            metadata: {
              demoPack: DEMO_PACK,
              demoId: deal.id,
              area: deal.area,
              closeScore: deal.closeScore,
              messageDraft: deal.messageDraft,
            } as object,
          },
        });
        rows.push({ contactId: contact.id, leadId: pl.id });
      }
    });
  } catch (e) {
    console.error("[broker-demo/assign-sample]", e);
    return NextResponse.json({ error: "Failed to create sample leads" }, { status: 500 });
  }

  await recordBrokerDemoEvent({
    action: "assign_sample_leads",
    userEmail: user.email,
    extra: { createdIds: rows.map((r) => r.leadId) },
  });

  return NextResponse.json({ ok: true, alreadyAssigned: false, count: rows.length, rows });
}
