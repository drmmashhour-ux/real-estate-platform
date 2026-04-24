import type { PlatformRole } from "@prisma/client";

import type { IntelligenceFeedItem, SignalAction, SignalDomain, SignalSeverity } from "./signal.types";
import {
  assistantFollowUp,
  autonomyHref,
  calendarHref,
  dealsHref,
  disputesHref,
  growthHref,
  leadsHref,
  listingAssistantHref,
  navigate,
  trustHref,
} from "./command-center-actions.service";
import type { CommandCenterFeedItem, FeedItemDomain } from "./command-center.types";
import { isExecutiveCommandCenter } from "./command-center.types";
function domainToSignalDomain(d: FeedItemDomain): SignalDomain {
  switch (d) {
    case "booking":
      return "LEAD";
    case "lead":
      return "LEAD";
    case "deal":
      return "DEAL";
    case "trust":
      return "TRUST";
    case "dispute":
      return "RISK";
    case "approval":
    case "autopilot":
      return "EXPANSION";
    case "marketing":
      return "MARKETING";
    default:
      return "LEAD";
  }
}

function laneToSeverity(lane: CommandCenterFeedItem["statusLane"]): SignalSeverity {
  if (lane === "urgent") return "CRITICAL";
  if (lane === "attention") return "WARNING";
  return "INFO";
}

function explainAndActions(
  item: CommandCenterFeedItem,
  role: PlatformRole,
): { explanation: string; actions: SignalAction[] } {
  switch (item.domain) {
    case "lead":
      return {
        explanation:
          "Fresh CRM activity — fast response preserves intent score and booking probability. Target first reply within minutes on business hours.",
        actions: [navigate("Open leads", leadsHref()), assistantFollowUp(role)],
      };
    case "deal":
      return {
        explanation:
          "Deal workspace changed — confirm stage, refresh intelligence, and schedule the next concrete milestone.",
        actions: [navigate("Pipeline", dealsHref()), navigate("Calendar", calendarHref())],
      };
    case "trust":
      return {
        explanation:
          "Operational trust engine flagged a signal — review context before it impacts distribution or reputation.",
        actions: [navigate("Trust console", trustHref(role)), navigate("Disputes", disputesHref(role))],
      };
    case "dispute":
      return {
        explanation:
          "Dispute activity requires structured response — SLA risk ties directly to marketplace health.",
        actions: [navigate("Open case", item.href), navigate("All disputes", disputesHref(role))],
      };
    case "autopilot":
      return {
        explanation:
          "AI CEO proposed a bounded adjustment — governance approval is required before automation applies.",
        actions:
          isExecutiveCommandCenter(role) ?
            [
              navigate("AI CEO queue", "/dashboard/admin/ai-ceo/system-adjustments"),
              navigate("Autonomy", autonomyHref(role)),
            ]
          : [navigate("Operations (broker)", leadsHref()), navigate("Listing assistant", listingAssistantHref())],
      };
    case "approval":
      return {
        explanation: "Approval queue item — sensitive change needs explicit reviewer decision with audit trail.",
        actions: [navigate("Open item", item.href)],
      };
    case "booking":
      return {
        explanation:
          "Visit pipeline moved — confirm attendance and prep materials to protect conversion.",
        actions: [navigate("Calendar", calendarHref()), navigate("Leads", leadsHref())],
      };
    case "marketing":
      return {
        explanation: "Marketing or publishing signal — validate creative and spend alignment with territory goals.",
        actions: isExecutiveCommandCenter(role) ?
            [navigate("Marketing AI", "/dashboard/admin/marketing-ai/daily"), navigate("Growth", growthHref())]
          : [navigate("Listing assistant", listingAssistantHref())],
      };
    default:
      return {
        explanation: "Operational signal — open the linked workspace for full context and next steps.",
        actions: [navigate("Detail", item.href)],
      };
  }
}

function intelligenceTitle(item: CommandCenterFeedItem): string {
  switch (item.domain) {
    case "lead":
      return "Lead signal — prioritize response";
    case "deal":
      return "Deal intelligence update";
    case "trust":
      return "Trust engine alert";
    case "dispute":
      return "Dispute — response recommended";
    case "autopilot":
      return "AI CEO proposal — approval required";
    case "booking":
      return "Visit pipeline — confirm next step";
    default:
      return item.title;
  }
}

export function mapCommandCenterFeedToIntelligence(
  raw: CommandCenterFeedItem[],
  role: PlatformRole,
): IntelligenceFeedItem[] {
  return raw.map((item) => {
    const { explanation, actions } = explainAndActions(item, role);
    const title = intelligenceTitle(item);
    return {
      id: item.id,
      domain: domainToSignalDomain(item.domain),
      title,
      explanation,
      recommendedActions: actions,
      href: item.href,
      createdAt: item.createdAt,
      severity: laneToSeverity(item.statusLane),
      icon: item.icon,
    };
  });
}
