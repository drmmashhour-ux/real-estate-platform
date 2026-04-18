import {
  engineFlags,
  fraudTrustV1Flags,
  growthV3Flags,
  marketplaceAiV5Flags,
  revenueV4Flags,
} from "@/config/feature-flags";
import type { ExplainableAgentDecision, MarketplaceAgentKind, AgentSuggestion } from "./agent.types";
import { loadAgentContext, type AgentSubject } from "./agent.context";
import { getAgentMemory } from "./agent.memory";
import { logAgentDecision } from "./agent.decision";

function baseSuggestions(ctx: Awaited<ReturnType<typeof loadAgentContext>>): AgentSuggestion[] {
  const s: AgentSuggestion[] = [];
  if (engineFlags.listingAutopilotV1) {
    s.push({
      action: "suggest_autopilot_scan",
      title: "Run listing quality autopilot",
      description: "Queues explainable FSBO checks — no automatic publish.",
      requiresApproval: false,
    });
  }
  if (growthV3Flags.growthBrainV1 || engineFlags.growthV2) {
    s.push({
      action: "suggest_growth_candidate",
      title: "Review growth opportunities",
      description: "Uses growth engine candidates — human approves campaigns.",
      requiresApproval: true,
    });
  }
  if (revenueV4Flags.revenueEngineV1) {
    s.push({
      action: "suggest_revenue_review",
      title: "Revenue prioritization review",
      description: "Data-backed listing monetization hints — not legal/financial advice.",
      requiresApproval: true,
    });
  }
  if (fraudTrustV1Flags.trustSystemV1) {
    s.push({
      action: "suggest_trust_verification",
      title: "Trust & verification checklist",
      description: "Step-up verification suggestions — policy gated.",
      requiresApproval: true,
    });
  }
  void ctx;
  return s;
}

async function runBuyerAgent(subject: AgentSubject): Promise<ExplainableAgentDecision | null> {
  const ctx = await loadAgentContext("buyer", subject);
  if (!ctx?.user) return null;
  const mem = await getAgentMemory("buyer", subject.type, subject.id);
  const dataUsed = [`user:${ctx.user.id}`, `persona:${ctx.user.marketplacePersona ?? "unset"}`];
  const reasoning = [
    "Buyer agent uses saved preferences + marketplace persona only.",
    mem.preferences.length ? `Stored preference hints: ${mem.preferences.slice(0, 3).join("; ")}` : "No durable preferences stored yet.",
  ];
  return {
    decision: "monitor_and_nudge",
    reasoning,
    confidence: 0.55,
    dataUsed,
    suggestions: [
      ...baseSuggestions(ctx),
      {
        action: "draft_message",
        title: "Draft follow-up (operator review)",
        description: "Prepares text drafts only — never auto-sends without consent.",
        requiresApproval: true,
      },
    ],
  };
}

async function runSellerAgent(subject: AgentSubject): Promise<ExplainableAgentDecision | null> {
  const ctx = await loadAgentContext("seller", subject);
  if (!ctx?.fsboListing) return null;
  const mem = await getAgentMemory("seller", subject.type, subject.id);
  const dataUsed = [`listing:${ctx.fsboListing.id}`, `city:${ctx.fsboListing.city}`, `trust:${ctx.fsboListing.trustScore ?? "n/a"}`];
  const reasoning = [
    `FSBO listing in ${ctx.fsboListing.city} — suggestions combine completeness + trust proxies.`,
    mem.preferences.length ? `Seller preference memory: ${mem.preferences[0]}` : "No seller preference memory.",
  ];
  return {
    decision: "optimize_listing_surface",
    reasoning,
    confidence: 0.52,
    dataUsed,
    suggestions: baseSuggestions(ctx),
  };
}

async function runBrokerAgent(subject: AgentSubject): Promise<ExplainableAgentDecision | null> {
  const ctx = await loadAgentContext("broker", subject);
  if (!ctx) return null;
  return {
    decision: "coordinate_deal_tasks",
    reasoning: [
      "Broker agent surfaces tasks only — licensed advice stays with the professional user.",
      "Closing strategies require broker judgment; system provides checklists and CRM hints.",
    ],
    confidence: 0.48,
    dataUsed: ["role:broker", `subject:${subject.type}:${subject.id}`],
    suggestions: baseSuggestions(ctx),
  };
}

async function runHostAgent(subject: AgentSubject): Promise<ExplainableAgentDecision | null> {
  const ctx = await loadAgentContext("host", subject);
  if (!ctx?.bnhubListing) return null;
  return {
    decision: "host_pricing_and_calendar_hints",
    reasoning: [
      "BNHub host agent references listing status and city — dynamic pricing changes require host approval.",
    ],
    confidence: 0.5,
    dataUsed: [`stay:${ctx.bnhubListing.id}`, `city:${ctx.bnhubListing.city}`],
    suggestions: baseSuggestions(ctx),
  };
}

async function runInvestorAgent(subject: AgentSubject): Promise<ExplainableAgentDecision | null> {
  const ctx = await loadAgentContext("investor", subject);
  if (!ctx?.user) return null;
  return {
    decision: "portfolio_watchlist",
    reasoning: [
      "Investor agent never implies securities advice — only platform inventory and saved search alignment.",
    ],
    confidence: 0.44,
    dataUsed: [`user:${ctx.user.id}`],
    suggestions: [
      ...baseSuggestions(ctx),
      {
        action: "no_action",
        title: "No automated capital allocation",
        description: "Capital deployment requires human approval and compliance review.",
        requiresApproval: true,
      },
    ],
  };
}

/**
 * Primary entry — returns explainable suggestions; persistence via decision log.
 */
export async function runMarketplaceAgent(
  kind: MarketplaceAgentKind,
  subject: AgentSubject,
): Promise<ExplainableAgentDecision | null> {
  if (!marketplaceAiV5Flags.agentSystemV1) return null;

  let decision: ExplainableAgentDecision | null = null;
  switch (kind) {
    case "buyer":
      decision = await runBuyerAgent(subject);
      break;
    case "seller":
      decision = await runSellerAgent(subject);
      break;
    case "broker":
      decision = await runBrokerAgent(subject);
      break;
    case "host":
      decision = await runHostAgent(subject);
      break;
    case "investor":
      decision = await runInvestorAgent(subject);
      break;
    default:
      return null;
  }

  if (decision) {
    await logAgentDecision({
      agentKind: kind,
      subjectType: subject.type,
      subjectId: subject.id,
      decisionType: "agent_run_v1",
      decision,
      requiresApproval: true,
    });
  }

  return decision;
}
