/**
 * Operator-facing hints for each priority — deterministic, advisory only.
 */

import { createHash } from "node:crypto";

import { PLATFORM_IMPROVEMENT_ADMIN_LINKS } from "./platform-improvement-links.constants";
import type {
  PlatformImprovementExecutionLink,
  PlatformImprovementPriority,
  PlatformImprovementPriorityCategory,
  PlatformImprovementPriorityCore,
} from "./platform-improvement.types";

function uniqByHref(links: PlatformImprovementExecutionLink[]): PlatformImprovementExecutionLink[] {
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}

/** Stable across runs for the same semantic priority row. */
export function stablePlatformPriorityId(p: Pick<PlatformImprovementPriorityCore, "category" | "title" | "why">): string {
  const raw = `${p.category}\n${p.title}\n${p.why}`;
  return createHash("sha256").update(raw, "utf8").digest("hex").slice(0, 14);
}

function classifyKind(
  p: Pick<PlatformImprovementPriorityCore, "category" | "title" | "why">,
): "cta" | "monetization" | "trust" | "ops_dup" | "ops_shortcuts" | "data" | "recs_off" | "generic" {
  const t = `${p.title} ${p.why}`.toLowerCase();
  if (t.includes("recommendations") && t.includes("off")) return "recs_off";
  if (t.includes("clarify primary cta") || (p.category === "conversion" && t.includes("cta"))) return "cta";
  if (p.category === "revenue" || t.includes("monetization")) return "monetization";
  if (t.includes("trust pattern")) return "trust";
  if (t.includes("duplicate operating")) return "ops_dup";
  if (t.includes("shortcut")) return "ops_shortcuts";
  if (t.includes("data moat")) return "data";
  return "generic";
}

function whyItMattersFor(category: PlatformImprovementPriorityCategory): string {
  switch (category) {
    case "revenue":
      return "Revenue surfaces stay aligned — fewer silent leaks between marketing and ledger.";
    case "conversion":
      return "First-session clarity drives leads without changing transactional flows.";
    case "trust":
      return "Trust friction caps listing and booking conversion.";
    case "ops":
      return "Operators ship faster when dashboards tell one coherent story.";
    case "data":
      return "Stronger captured signals compound pricing and retention intelligence.";
    default:
      return "Reduces platform drag for internal and external users.";
  }
}

export function enrichPlatformImprovementPriority(core: PlatformImprovementPriorityCore): PlatformImprovementPriority {
  const id = stablePlatformPriorityId(core);
  const kind = classifyKind(core);
  const haystack = `${core.title} ${core.why}`.toLowerCase();

  let suggestedOwnerArea = "platform/ops";
  let suggestedNextStep =
    "Discuss in stand-up and pick an owner via Mission Control / Management Hub — advisory only.";
  let links: PlatformImprovementExecutionLink[] = [
    { kind: "mission_control", label: "Mission control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.missionControlGrowth },
    { kind: "growth_machine", label: "Growth engine", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.growthMachine },
  ];

  const growthContentBundle = (): void => {
    suggestedOwnerArea = "growth/content";
    suggestedNextStep =
      "Align homepage and funnel copy with the primary CTA in Growth engine + content ops; validate in staging.";
    links = [
      { kind: "growth_machine", label: "Growth engine", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.growthMachine },
      { kind: "mission_control", label: "Mission control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.missionControlGrowth },
      { kind: "growth_machine", label: "Content ops", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.contentOps },
    ];
  };

  const trustProductBundle = (): void => {
    suggestedOwnerArea = "product/content";
    suggestedNextStep =
      "Ship trust copy and badges where gaps appear; cross-check with TrustGraph / BNHub host health.";
    links = [
      { kind: "mission_control", label: "TrustGraph admin", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.trustGraph },
      { kind: "bnhub_host_admin", label: "BNHub host dashboard", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.bnhubHostDashboard },
      { kind: "mission_control", label: "Executive control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.executiveControl },
    ];
  };

  const revenueBundle = (): void => {
    suggestedOwnerArea = "growth/revenue";
    suggestedNextStep =
      "Trace paid/unlock paths in Revenue & ledger and Growth engine; align labels across dashboards.";
    links = [
      { kind: "revenue", label: "Growth (revenue)", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.revenueGrowthPanel },
      { kind: "revenue", label: "Revenue & ledger", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.revenueLedger },
      { kind: "growth_machine", label: "Growth engine", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.growthMachine },
      { kind: "mission_control", label: "Mission control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.missionControlGrowth },
    ];
  };

  const opsAdminBundle = (): void => {
    suggestedOwnerArea = "admin/ops";
    suggestedNextStep =
      "Consolidate duplicate panels in Management Hub; document the canonical narrative in Mission control.";
    links = [
      { kind: "mission_control", label: "Management hub", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.managementHub },
      { kind: "mission_control", label: "Mission control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.missionControlGrowth },
      { kind: "growth_machine", label: "Growth engine", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.growthMachine },
    ];
  };

  switch (kind) {
    case "cta":
      growthContentBundle();
      break;
    case "monetization":
      revenueBundle();
      break;
    case "trust":
      trustProductBundle();
      break;
    case "ops_dup":
    case "ops_shortcuts":
      opsAdminBundle();
      if (haystack.includes("broker") || haystack.includes("acquisition")) {
        links.unshift({
          kind: "broker_acquisition",
          label: "Broker acquisition",
          href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.brokerAcquisition,
        });
      }
      if (haystack.includes("bnhub") || haystack.includes("booking")) {
        links.unshift({
          kind: "bnhub_host_admin",
          label: "BNHub host dashboard",
          href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.bnhubHostDashboard,
        });
      }
      links = uniqByHref(links);
      break;
    case "data":
      suggestedOwnerArea = "product/data";
      suggestedNextStep =
        "Prioritize one signal to instrument; validate in analytics tools before expanding capture.";
      links = [
        { kind: "mission_control", label: "Analytics tools", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.analyticsTools },
        { kind: "mission_control", label: "Mission control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.missionControlGrowth },
      ];
      break;
    case "recs_off":
      suggestedOwnerArea = "growth/product";
      suggestedNextStep =
        "Evaluate recommendations flags in Growth engine before expanding browse surfaces.";
      links = [
        { kind: "growth_machine", label: "Growth engine", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.growthMachine },
        { kind: "mission_control", label: "Analytics tools", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.analyticsTools },
      ];
      break;
    default: {
      const c = core.category;
      if (c === "trust") trustProductBundle();
      else if (c === "revenue") revenueBundle();
      else if (c === "conversion") growthContentBundle();
      else if (c === "ops") opsAdminBundle();
      else if (c === "data") {
        suggestedOwnerArea = "product/data";
        suggestedNextStep = "Pick one moat signal; instrument and review in analytics.";
        links = [
          { kind: "mission_control", label: "Analytics tools", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.analyticsTools },
          { kind: "mission_control", label: "Mission control", href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.missionControlGrowth },
        ];
      }
      if (haystack.includes("host") || haystack.includes("bnhub")) {
        links.unshift({
          kind: "bnhub_host_admin",
          label: "BNHub host dashboard",
          href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.bnhubHostDashboard,
        });
      }
      if (haystack.includes("broker")) {
        links.unshift({
          kind: "broker_acquisition",
          label: "Broker acquisition",
          href: PLATFORM_IMPROVEMENT_ADMIN_LINKS.brokerAcquisition,
        });
      }
      links = uniqByHref(links);
      break;
    }
  }

  return {
    ...core,
    id,
    whyItMatters: whyItMattersFor(core.category),
    suggestedOwnerArea,
    suggestedNextStep,
    executionLinks: uniqByHref(links),
  };
}
