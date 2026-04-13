import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import {
  mortgageExpertHasMonthlyCapacity,
  mortgageExpertMonthlyCap,
  ensureExpertBillingRow,
} from "@/modules/mortgage/services/billing-usage";
import { mortgageExpertDailyCap, tryAssignSlotAndDecrementCredits } from "@/modules/mortgage/services/lead-assignment";
import { notifyMortgageExpertNewLead } from "@/modules/mortgage/services/notify-expert-lead";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

/** POST — claim a marketplace lead (uses same slot + credit rules as auto-assign). */
export async function POST(req: NextRequest) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const body = await req.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const expertFull = await prisma.mortgageExpert.findUnique({
    where: { id: session.expert.id },
    include: { expertSubscription: true, expertCredits: true, expertBilling: true },
  });
  if (!expertFull) return NextResponse.json({ error: "Expert not found" }, { status: 404 });
  if (expertFull.expertVerificationStatus !== "verified") {
    return NextResponse.json(
      { error: "Complete professional verification before claiming marketplace leads." },
      { status: 403 }
    );
  }

  const cap = mortgageExpertDailyCap(expertFull);
  if (!mortgageExpertHasMonthlyCapacity(expertFull, expertFull.expertBilling)) {
    return NextResponse.json(
      { error: "Monthly lead limit reached for your plan. Upgrade or wait until next month." },
      { status: 403 }
    );
  }
  const monthCap = mortgageExpertMonthlyCap(expertFull);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: {
          id: leadId,
          leadType: "mortgage",
          mortgageMarketplaceStatus: "open",
          assignedExpertId: null,
        },
      });
      if (!lead) return null;

      const creditCost = lead.mortgageCreditCost ?? 1;
      const activePlan = expertFull.expertSubscription?.isActive
        ? expertFull.expertSubscription.plan.toLowerCase().trim()
        : "basic";
      if (lead.revenueTier === "HIGH" && activePlan !== "premium") {
        throw new Error("PREMIUM_REQUIRED");
      }

      if (expertFull.expertCredits && expertFull.expertCredits.credits < creditCost) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      await ensureExpertBillingRow(tx, expertFull.id);
      const ok = await tryAssignSlotAndDecrementCredits(tx, expertFull.id, cap, monthCap, creditCost);
      if (!ok) return null;

      return tx.lead.update({
        where: { id: leadId },
        data: {
          assignedExpertId: expertFull.id,
          mortgageMarketplaceStatus: null,
          mortgageAssignedAt: new Date(),
        },
      });
    });

    if (updated === null) {
      return NextResponse.json(
        { error: "Lead unavailable or daily cap / credits reached" },
        { status: 409 }
      );
    }

    await appendLeadTimelineEvent(leadId, "mortgage_marketplace_claimed", {
      expertId: expertFull.id,
    }).catch(() => {});

    void notifyMortgageExpertNewLead({
      expertId: expertFull.id,
      leadId,
      clientName: updated.name,
      clientEmail: updated.email,
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PREMIUM_REQUIRED") {
      return NextResponse.json(
        {
          error:
            "This is a high-value lead — Premium subscription is required to claim. Upgrade under Billing.",
        },
        { status: 403 }
      );
    }
    if (msg === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { error: "Not enough lead credits for this lead. Purchase more credits or upgrade." },
        { status: 403 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
