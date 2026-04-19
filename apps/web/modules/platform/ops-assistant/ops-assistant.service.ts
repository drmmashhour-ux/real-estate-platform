/**
 * Deterministic suggestion engine — suggestions & prefills only; no execution.
 */

import { createHash } from "node:crypto";

import type { PlatformImprovementPriority, PlatformPriorityStatus } from "../platform-improvement.types";
import {
  buildCtaPrefill,
  buildFeaturedListingHintPrefill,
  buildOpsConsolidationPrefill,
  buildTrustStripPrefill,
} from "./ops-assistant-prefill.service";
import { filterToSafeSuggestions } from "./ops-assistant-safety.service";
import type { OpsAssistantSuggestion } from "./ops-assistant.types";
import { recordOpsAssistantSuggestionsBuilt } from "./ops-assistant-monitoring.service";

const MAX_SUGGESTIONS = 3;

function sid(priorityId: string, kind: string): string {
  return createHash("sha256").update(`${priorityId}|ops-assistant|${kind}`, "utf8").digest("hex").slice(0, 12);
}

function baseQuery(priorityId: string): Record<string, string> {
  return {
    from: "ops-assistant",
    priorityId,
  };
}

function nextWorkflowStatus(from: PlatformPriorityStatus): PlatformPriorityStatus | null {
  switch (from) {
    case "new":
      return "acknowledged";
    case "acknowledged":
      return "planned";
    case "planned":
      return "in_progress";
    case "in_progress":
      return "done";
    default:
      return null;
  }
}

function reviewExecutable(
  href: string,
  title: string,
  priorityId: string,
): NonNullable<OpsAssistantSuggestion["executable"]> {
  return {
    actionType: "createInternalReviewTask",
    expectedOutcome:
      "Creates an internal review task pointing at this admin route — does not change live product settings.",
    proposedPayload: {
      reviewTargetHref: href,
      reviewTitle: title,
      draftText: `[Review] ${title}\npriority=${priorityId.slice(0, 8)}…`,
    },
  };
}

/**
 * Builds up to three low-risk, deterministic suggestions for a single priority.
 */
export function buildOpsSuggestions(
  priority: PlatformImprovementPriority,
  opts?: { currentStatus?: PlatformPriorityStatus },
): OpsAssistantSuggestion[] {
  const t = `${priority.title} ${priority.why}`.toLowerCase();
  const out: OpsAssistantSuggestion[] = [];

  const st = opts?.currentStatus ?? "new";
  const wfNext = nextWorkflowStatus(st);
  if (wfNext && st !== "done" && st !== "dismissed") {
    out.push({
      id: sid(priority.id, "workflow-next"),
      priorityId: priority.id,
      title: `Advance workflow → ${wfNext.replace(/_/g, " ")}`,
      description:
        "Approval-only: updates this priority’s status in the internal execution bridge (same rules as manual actions).",
      actionType: "adjust_setting",
      targetSurface: "growth",
      riskLevel: "low",
      requiresConfirmation: true,
      executable: {
        actionType: "updatePriorityWorkflowState",
        expectedOutcome: `Sets execution status to "${wfNext}" after approval — reversible via undo when transitions allow.`,
        proposedPayload: { targetStatus: wfNext },
      },
    });
  }

  const push = (s: OpsAssistantSuggestion) => {
    if (out.length >= MAX_SUGGESTIONS) return;
    out.push(s);
  };

  /* Conversion / CTA clarity */
  if (
    priority.category === "conversion" ||
    t.includes("cta") ||
    t.includes("clarify") ||
    t.includes("primary cta")
  ) {
    const prefill = buildCtaPrefill(priority);
    push({
      id: sid(priority.id, "cta-copy"),
      priorityId: priority.id,
      title: "Draft clearer primary CTA copy",
      description:
        "Prefilled draft based on this priority’s context. Confirm to copy — paste into your content surface after review.",
      actionType: "edit_copy",
      targetSurface: "homepage",
      prefillData: prefill,
      riskLevel: "low",
      requiresConfirmation: true,
      executable: {
        actionType: "createInternalDraft",
        expectedOutcome: "Stores an internal draft record (not published to any surface).",
        proposedPayload: { draftText: prefill.text ?? "" },
      },
    });
    const growthEngineHref = "/admin/growth-engine";
    push({
      id: sid(priority.id, "cta-nav-marketing"),
      priorityId: priority.id,
      title: "Open marketing / growth area",
      description:
        "Navigate to the growth console to align homepage and funnel copy with the primary CTA (manual edits only).",
      actionType: "navigate",
      targetSurface: "growth",
      riskLevel: "low",
      requiresConfirmation: true,
      href: growthEngineHref,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(growthEngineHref, "Review growth console for CTA alignment", priority.id),
    });
  }

  /* Trust */
  if (priority.category === "trust" || t.includes("trust pattern")) {
    const tpref = buildTrustStripPrefill(priority);
    push({
      id: sid(priority.id, "trust-copy"),
      priorityId: priority.id,
      title: "Add a trust strip line",
      description: "Template line you can refine; confirm copies to clipboard — no automatic publish.",
      actionType: "edit_copy",
      targetSurface: "homepage",
      prefillData: tpref,
      riskLevel: "low",
      requiresConfirmation: true,
      executable: {
        actionType: "createInternalDraft",
        expectedOutcome: "Stores an internal draft of the trust line — no live publish.",
        proposedPayload: { draftText: tpref.text ?? "" },
      },
    });
    const tgHref = "/admin/trustgraph";
    push({
      id: sid(priority.id, "trust-nav"),
      priorityId: priority.id,
      title: "Review TrustGraph admin",
      description: "Open TrustGraph to align badges and messaging (read/review — no auto changes).",
      actionType: "navigate",
      targetSurface: "bnhub",
      riskLevel: "low",
      requiresConfirmation: true,
      href: tgHref,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(tgHref, "Review TrustGraph messaging", priority.id),
    });
  }

  /* Revenue / monetization */
  if (priority.category === "revenue" || t.includes("monetization")) {
    const revHref = "/admin/growth";
    push({
      id: sid(priority.id, "rev-growth"),
      priorityId: priority.id,
      title: "Open growth (revenue) hub",
      description: "Navigate to the growth surface to review paid paths and labels — manual changes only.",
      actionType: "navigate",
      targetSurface: "revenue",
      riskLevel: "low",
      requiresConfirmation: true,
      href: revHref,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(revHref, "Review growth / revenue hub", priority.id),
    });
    const featPref = buildFeaturedListingHintPrefill(priority);
    push({
      id: sid(priority.id, "rev-checklist"),
      priorityId: priority.id,
      title: "Review featured listings setup",
      description:
        "Informational checklist prefilled from templates — confirm to copy; does not toggle Stripe or checkout.",
      actionType: "adjust_setting",
      targetSurface: "listings",
      prefillData: featPref,
      riskLevel: "low",
      requiresConfirmation: true,
      executable: {
        actionType: "prefillInternalConfigDraft",
        expectedOutcome:
          "Stores a non-live configuration draft from this checklist — does not apply env or Stripe changes.",
        proposedPayload: {
          configKeyHint: featPref.configKeyHint ?? "visibility_checklist",
          configDraftValue: featPref.text ?? "",
          draftText: featPref.text ?? "",
        },
      },
    });
    const ctrlHref = "/admin/controls";
    push({
      id: sid(priority.id, "rev-controls"),
      priorityId: priority.id,
      title: "Review platform controls (flags)",
      description:
        "Opens controls where flags are documented — you toggle manually; assistant never changes env or DB.",
      actionType: "navigate",
      targetSurface: "growth",
      riskLevel: "low",
      requiresConfirmation: true,
      href: ctrlHref,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(ctrlHref, "Review platform controls documentation", priority.id),
    });
  }

  /* Ops */
  if (priority.category === "ops" || t.includes("duplicate") || t.includes("shortcut")) {
    const opref = buildOpsConsolidationPrefill(priority);
    push({
      id: sid(priority.id, "ops-consolidate"),
      priorityId: priority.id,
      title: "Capture consolidation note",
      description: "Copy a short internal note for stand-up — does not merge dashboards automatically.",
      actionType: "edit_copy",
      targetSurface: "growth",
      prefillData: opref,
      riskLevel: "low",
      requiresConfirmation: true,
      executable: {
        actionType: "createInternalFollowupTask",
        expectedOutcome: "Creates an internal follow-up task prefilled with this consolidation note.",
        proposedPayload: {
          followupNote: opref.text ?? "",
          draftText: opref.text ?? "",
        },
      },
    });
    const hubHref = "/admin/management-hub";
    push({
      id: sid(priority.id, "ops-hub"),
      priorityId: priority.id,
      title: "Open management hub",
      description: "Navigate to management hub to align duplicate panels manually.",
      actionType: "navigate",
      targetSurface: "growth",
      riskLevel: "low",
      requiresConfirmation: true,
      href: hubHref,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(hubHref, "Review management hub for duplicate panels", priority.id),
    });
  }

  /* Data */
  if (priority.category === "data" || t.includes("data moat")) {
    const analyticsHref = "/admin/analytics/tools";
    push({
      id: sid(priority.id, "data-analytics"),
      priorityId: priority.id,
      title: "Open analytics tools",
      description: "Navigate to analytics tools to validate one signal before expanding capture.",
      actionType: "navigate",
      targetSurface: "get_leads",
      riskLevel: "low",
      requiresConfirmation: true,
      href: analyticsHref,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(analyticsHref, "Review analytics tools / signals", priority.id),
    });
  }

  /* Broker acquisition hints (title only — category does not include broker) */
  if (t.includes("broker") && t.includes("acquisition")) {
    const brHref = "/admin/brokers-acquisition";
    push({
      id: sid(priority.id, "broker-nav"),
      priorityId: priority.id,
      title: "Open broker acquisition",
      description: "Navigate to broker acquisition workspace — manual follow-up only.",
      actionType: "navigate",
      targetSurface: "broker",
      riskLevel: "low",
      requiresConfirmation: true,
      href: brHref,
      queryParams: baseQuery(priority.id),
      executable: {
        actionType: "addInternalPriorityTag",
        expectedOutcome:
          'Adds internal triage tag "broker-acquisition" for filtering — does not message brokers or change ads.',
        proposedPayload: { tag: "broker-acquisition" },
      },
    });
  }

  /* Fallback: at least one navigate to primary execution route */
  if (out.length === 0) {
    const fh = defaultHrefForCategory(priority.category);
    push({
      id: sid(priority.id, "fallback-go-fix"),
      priorityId: priority.id,
      title: "Go to execution surface",
      description: "Open the mapped admin route for this category; you stay in control of all edits.",
      actionType: "navigate",
      targetSurface: "growth",
      riskLevel: "low",
      requiresConfirmation: true,
      href: fh,
      queryParams: baseQuery(priority.id),
      executable: reviewExecutable(fh, "Review default execution surface", priority.id),
    });
  }

  const safe = filterToSafeSuggestions(out.slice(0, MAX_SUGGESTIONS));
  recordOpsAssistantSuggestionsBuilt(priority.id, safe.length);
  return safe;
}

function defaultHrefForCategory(c: PlatformImprovementPriority["category"]): string {
  switch (c) {
    case "revenue":
      return "/admin/growth";
    case "conversion":
      return "/admin/growth-engine";
    case "trust":
      return "/admin/bnhub";
    case "ops":
      return "/admin";
    case "data":
      return "/admin/dashboard";
    default:
      return "/admin";
  }
}

export function buildOpsAssistantMapByPriorityId(
  priorities: PlatformImprovementPriority[],
  statusByPriorityId: Record<string, PlatformPriorityStatus>,
): Record<string, OpsAssistantSuggestion[]> {
  const m: Record<string, OpsAssistantSuggestion[]> = {};
  for (const p of priorities) {
    const st = statusByPriorityId[p.id] ?? "new";
    m[p.id] = buildOpsSuggestions(p, { currentStatus: st });
  }
  return m;
}
