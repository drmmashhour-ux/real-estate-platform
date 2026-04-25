import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const totalLeads = await prisma.brokerOnboardingLead.count({
      where: { status: { not: "new" } }
    });

    const demoDone = await prisma.brokerOnboardingLead.count({
      where: { status: { in: ["demo_done", "trial_started", "first_deal", "onboarded"] } }
    });

    const trialStarted = await prisma.brokerOnboardingLead.count({
      where: { status: { in: ["trial_started", "first_deal", "onboarded"] } }
    });

    const paid = await prisma.brokerOnboardingLead.count({
      where: { status: "onboarded" }
    });

    return NextResponse.json({
      metrics: {
        totalLeads,
        demoDone,
        trialStarted,
        paid
      },
      conversion: {
        demoToTrial: demoDone > 0 ? Math.round((trialStarted / demoDone) * 100) : 0,
        trialToPaid: trialStarted > 0 ? Math.round((paid / trialStarted) * 100) : 0,
        overall: totalLeads > 0 ? Math.round((paid / totalLeads) * 100) : 0
      },
      dropOffs: [
        { stage: "Contact -> Demo", rate: totalLeads > 0 ? 100 - Math.round((demoDone / totalLeads) * 100) : 0 },
        { stage: "Demo -> Trial", rate: demoDone > 0 ? 100 - Math.round((trialStarted / demoDone) * 100) : 0 },
        { stage: "Trial -> Paid", rate: trialStarted > 0 ? 100 - Math.round((paid / trialStarted) * 100) : 0 },
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
