import "server-only";

import { getCampaignOptimizationInsightsForMarketplace } from "@/lib/marketing/campaignOptimizer";
import { getEarlyUserSignals } from "@/lib/growth/earlyUserSignals";
import { getLegacyDB } from "@/lib/db/legacy";
import { generateInvestorMessage } from "@/lib/investor/outreach";
import {
  type InvestorLeadStatus,
  isValidInvestorLeadStatus,
} from "@/lib/investor/investorLeadStatus";
import { trackEvent } from "@/src/services/analytics";

const prisma = getLegacyDB();

export { INVESTOR_LEAD_STATUSES, type InvestorLeadStatus } from "@/lib/investor/investorLeadStatus";

async function loadMessageContext(): Promise<{
  cityFocus: string | undefined;
  earlyUserCount: number;
  activeCampaignsCount: number;
}> {
  const [early, campaigns] = await Promise.all([
    getEarlyUserSignals().catch(() => ({ count: 0, remaining: 0, isEarlyPhase: false, message: "" })),
    getCampaignOptimizationInsightsForMarketplace().catch(() => []),
  ]);
  const cityFocus =
    process.env.INVESTOR_PITCH_CITY_FOCUS?.trim() ||
    process.env.NEXT_PUBLIC_DEFAULT_MARKET_CITY?.trim() ||
    undefined;
  return {
    cityFocus,
    earlyUserCount: early.count,
    activeCampaignsCount: campaigns.length,
  };
}

/**
 * Draft + log a first outreach message (no SMTP / SendGrid — copy is for CRM or manual send).
 */
export async function sendInvestorMessage(investorId: string): Promise<
  | { ok: true; message: string; outreachId: string }
  | { ok: false; error: string; code: "not_found" | "db" }
> {
  try {
    const lead = await prisma.investorLead.findUnique({ where: { id: investorId } });
    if (!lead) return { ok: false, error: "Investor lead not found", code: "not_found" };

    const ctx = await loadMessageContext();
    const message = generateInvestorMessage(lead.name ?? "", {
      cityFocus: ctx.cityFocus,
      earlyUserCount: ctx.earlyUserCount,
      activeCampaignsCount: ctx.activeCampaignsCount,
    });

    const row = await prisma.investorOutreach.create({
      data: {
        investorId: lead.id,
        message,
      },
    });

    await prisma.investorLead.update({
      where: { id: lead.id },
      data: { status: "contacted" },
    });

    void trackEvent("investor_message_sent", { investorId: lead.id });

    return { ok: true, message, outreachId: row.id };
  } catch (e) {
    console.error("[sendInvestorMessage]", e);
    return { ok: false, error: "Failed to send or log message", code: "db" };
  }
}

/**
 * Mark that the investor replied (pipeline moves to **replied**).
 */
export async function logInvestorReply(investorId: string): Promise<
  { ok: true } | { ok: false; error: string; code: "not_found" | "db" }
> {
  try {
    const lead = await prisma.investorLead.findUnique({ where: { id: investorId } });
    if (!lead) return { ok: false, error: "Investor lead not found", code: "not_found" };

    await prisma.investorLead.update({
      where: { id: investorId },
      data: { status: "replied" },
    });

    void trackEvent("investor_replied", { investorId });

    return { ok: true };
  } catch (e) {
    console.error("[logInvestorReply]", e);
    return { ok: false, error: "Failed to log reply", code: "db" };
  }
}

/**
 * Manual status update (e.g. drag on pipeline). Emits `investor_meeting_scheduled` when moving to **meeting**.
 */
export async function updateInvestorStatus(
  investorId: string,
  status: string
): Promise<{ ok: true } | { ok: false; error: string; code: "not_found" | "invalid_status" | "db" }> {
  if (!isValidInvestorLeadStatus(status)) {
    return { ok: false, error: "Invalid status", code: "invalid_status" };
  }
  try {
    const lead = await prisma.investorLead.findUnique({ where: { id: investorId } });
    if (!lead) return { ok: false, error: "Investor lead not found", code: "not_found" };

    await prisma.investorLead.update({
      where: { id: investorId },
      data: { status },
    });

    if (status === "meeting") {
      void trackEvent("investor_meeting_scheduled", { investorId });
    }

    return { ok: true };
  } catch (e) {
    console.error("[updateInvestorStatus]", e);
    return { ok: false, error: "Failed to update status", code: "db" };
  }
}

export type InvestorLeadListRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  createdAt: Date;
  lastContactAt: Date | null;
};

/**
 * For admin UI: all leads with latest outreach time.
 */
export async function listInvestorLeadsForAdmin(): Promise<InvestorLeadListRow[]> {
  const leads = await prisma.investorLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      outreach: { orderBy: { sentAt: "desc" }, take: 1, select: { sentAt: true } },
    },
  });

  return leads.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    status: l.status,
    createdAt: l.createdAt,
    lastContactAt: l.outreach[0]?.sentAt ?? null,
  }));
}

/**
 * Additive helper — create a lead from admin (not in original one-liner spec; required to populate the pipeline).
 */
export async function createInvestorLead(input: {
  name?: string | null;
  email?: string | null;
  status?: InvestorLeadStatus;
}): Promise<{ ok: true; id: string } | { ok: false; error: string; code: "invalid_status" | "db" }> {
  if (input.status && !isValidInvestorLeadStatus(input.status)) {
    return { ok: false, error: "Invalid status", code: "invalid_status" };
  }
  try {
    const row = await prisma.investorLead.create({
      data: {
        name: input.name?.trim() || null,
        email: input.email?.trim() || null,
        status: input.status ?? "new",
      },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    console.error("[createInvestorLead]", e);
    return { ok: false, error: "Failed to create lead", code: "db" };
  }
}
