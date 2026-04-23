import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";

import { resolveCentrisBrokerRouting } from "../centris-conversion/centris-broker-routing.service";

import { recordAiSalesEvent } from "./ai-sales-log.service";
import type { AiSalesEscalationReason, AiSalesMode, AiSalesQualificationResult } from "./ai-sales.types";

export function shouldEscalateToBroker(input: {
  qualification: AiSalesQualificationResult;
  visitRequested: boolean;
  complexQuestion: boolean;
}): AiSalesEscalationReason | null {
  if (input.visitRequested) return "visit_requested";
  if (input.complexQuestion) return "complex_question";
  if (input.qualification.tier === "HOT") return "tier_hot";
  return null;
}

/** Notifies listing broker — assists humans; does not assign commission rules. */
export async function escalateLeadToBroker(params: {
  leadId: string;
  reason: AiSalesEscalationReason;
  summary: string;
  mode: AiSalesMode;
}): Promise<{ ok: boolean; brokerId: string | null }> {
  const since = new Date(Date.now() - 24 * 3600000);
  const recent = await prisma.leadTimelineEvent.findFirst({
    where: {
      leadId: params.leadId,
      eventType: "AI_SALES_ESCALATION",
      createdAt: { gte: since },
    },
  });
  if (recent) {
    return { ok: true, brokerId: null };
  }

  const routing = await resolveCentrisBrokerRouting(params.leadId);
  const brokerId = routing.bestBrokerId;

  await recordAiSalesEvent(params.leadId, "AI_SALES_ESCALATION", {
    assistant: "lecipm",
    mode: params.mode,
    explain: `escalation:${params.reason}`,
    metadata: {
      routingReason: routing.routingReason,
      brokerId,
      summary: params.summary.slice(0, 500),
    },
  });

  if (!brokerId) {
    return { ok: false, brokerId: null };
  }

  const broker = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { email: true, name: true },
  });

  if (!broker?.email) {
    return { ok: false, brokerId };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    select: { name: true, email: true },
  });

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
<p><strong>LECIPM assistant</strong> — escalation to you (licensed broker).</p>
<p><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>
<p>${escapeHtml(params.summary)}</p>
<p><strong>Lead:</strong> ${escapeHtml(lead?.name ?? "")} · ${escapeHtml(lead?.email ?? "")}</p>
<p style="font-size:12px;color:#555">${escapeHtml(routing.routingReason)}</p>
</body></html>`;

  await sendTransactionalEmail({
    to: broker.email,
    subject: `[LECIPM] Assistant escalation — ${params.reason}`,
    html,
    template: "ai_sales_escalation",
  });

  return { ok: true, brokerId };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
