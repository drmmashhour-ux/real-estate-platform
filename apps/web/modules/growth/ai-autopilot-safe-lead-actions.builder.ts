/**
 * Builds a small set of whitelist-bound lead actions (latest leads) — additive to advisory snapshot actions.
 */

import { prisma } from "@/lib/db";
import { applyIntelligenceLayer, buildGrowthUnifiedSnapshot } from "./ai-autopilot.service";
import type { AiAutopilotAction } from "./ai-autopilot.types";

const MAX_LEADS = 2;

export async function buildSafeLeadAutopilotActions(): Promise<AiAutopilotAction[]> {
  const now = new Date().toISOString();
  try {
    const leads = await prisma.lead.findMany({
      take: MAX_LEADS,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });

    const out: Omit<AiAutopilotAction, "priorityScore" | "signalStrength">[] = [];

    for (const lead of leads) {
      const label = lead.name?.trim() || lead.id.slice(0, 8);
      out.push(
        {
          id: `safe-lead_timeline_handled-${lead.id}`,
          title: `Internal: mark review handled (timeline) — ${label}`,
          description:
            "Appends an internal LeadTimelineEvent for handled review. Reversible by rollback. No outbound messaging.",
          source: "leads",
          impact: "low",
          confidence: 0.55,
          executionMode: "approval_required",
          createdAt: now,
          why: "Recent lead needs explicit handled state for pipeline hygiene.",
          actionType: "lead_timeline_handled",
          targetId: lead.id,
          targetType: "lead",
          reversible: true,
          domain: "leads",
        },
        {
          id: `safe-lead_timeline_followup-${lead.id}`,
          title: `Internal: set follow-up flag (timeline) — ${label}`,
          description:
            "Appends an internal LeadTimelineEvent requesting follow-up. Reversible by rollback. Does not send messages.",
          source: "leads",
          impact: "low",
          confidence: 0.55,
          executionMode: "approval_required",
          createdAt: now,
          why: "Follow-up signal keeps sales motion from stalling.",
          actionType: "lead_timeline_followup",
          targetId: lead.id,
          targetType: "lead",
          reversible: true,
          domain: "leads",
        },
        {
          id: `safe-lead_launch_sales_contacted-${lead.id}`,
          title: `Internal: launch sales contacted flag — ${label}`,
          description:
            "Sets launchSalesContacted + launchLastContactDate on the lead (internal sales tracking). Reversible.",
          source: "leads",
          impact: "low",
          confidence: 0.5,
          executionMode: "approval_required",
          createdAt: now,
          why: "Launch tracking alignment for sales outreach state.",
          actionType: "lead_launch_sales_contacted",
          targetId: lead.id,
          targetType: "lead",
          reversible: true,
          domain: "leads",
        },
      );
    }

    const snapshot = buildGrowthUnifiedSnapshot();
    return out.map((a) => applyIntelligenceLayer(a, snapshot));
  } catch {
    return [];
  }
}
