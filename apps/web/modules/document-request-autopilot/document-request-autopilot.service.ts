import { DealRequestCategory, DealRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";
import { defaultRequestPolicy } from "@/modules/document-requests/request-policy.service";
import { getTemplateForCategory } from "@/modules/document-requests/request-template.service";
import type { AutopilotSuggestion } from "./document-request-autopilot.types";
import { sortSuggestionsByUrgency } from "./request-priority.service";
import { listEscalations } from "./escalation-engine.service";

export async function runDocumentRequestAutopilot(dealId: string, dealStatus: string, actorUserId: string) {
  const policy = defaultRequestPolicy();
  const expected = expectedCategoriesForStage(dealStatus);
  const existing = await prisma.dealRequest.findMany({
    where: { dealId },
    select: { requestCategory: true, status: true, id: true, title: true },
  });

  const suggestions: AutopilotSuggestion[] = [];
  const active = existing.filter(
    (e) => e.status !== DealRequestStatus.FULFILLED && e.status !== DealRequestStatus.CANCELLED
  );

  for (const cat of expected) {
    const has = active.some((e) => e.requestCategory === cat);
    if (!has) {
      const template = getTemplateForCategory(cat as DealRequestCategory);
      if (template) {
        suggestions.push({
          type: "missing_documents",
          title: `Consider: ${template.title}`,
          summary: template.summary,
          targetRole: template.targetRole,
          urgency: dealStatus === "closing_scheduled" ? "high" : "medium",
          reasons: [`Stage “${dealStatus}” typically needs ${cat} coverage`, "No open request of this category found"],
          recommendedAction: policy.autopilotCreatesDraftOnly
            ? "Create a draft request from template and review before sending."
            : "Review policy — autopilot drafts only in v1.",
          brokerApprovalRequired: true,
          templateCategory: cat,
        });
      }
    }
  }

  const esc = await listEscalations(dealId);
  for (const r of esc.blocked) {
    suggestions.push({
      type: "notary_prep",
      title: `Blocked request: ${r.title}`,
      summary: r.blockedReason ?? "See request detail",
      targetRole: r.targetRole,
      urgency: "high",
      reasons: ["Request marked blocked"],
      recommendedAction: "Resolve blocker or cancel request with file note.",
      brokerApprovalRequired: true,
    });
  }
  for (const r of esc.overdue) {
    suggestions.push({
      type: "overdue",
      title: `Overdue: ${r.title}`,
      summary: `Due ${r.dueAt?.toISOString().slice(0, 10) ?? ""}`,
      targetRole: r.targetRole,
      urgency: "high",
      reasons: ["Past due date"],
      recommendedAction: "Send reminder draft or update timeline with parties.",
      brokerApprovalRequired: true,
    });
  }

  await logCoordinationAudit({
    dealId,
    action: "autopilot_suggestion",
    actorUserId,
    payload: { count: suggestions.length },
  });

  return { suggestions: sortSuggestionsByUrgency(suggestions), policy };
}
