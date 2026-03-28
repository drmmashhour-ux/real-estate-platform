import { prisma } from "@/lib/db";
import type { AiIntent, AiObjection } from "@/src/modules/messaging/aiClassifier";
import { normDim, type LearningRoutingContext } from "@/src/modules/messaging/learning/contextKey";
import {
  chooseExperimentTemplate,
  getActiveExperimentForContext,
  isExperimentFlowSafe,
} from "@/src/modules/messaging/learning/experiments";
import { getLearningRecommendation } from "@/src/modules/messaging/learning/learningEngine";
import { isSelfLearningRoutingEnabled } from "@/src/modules/messaging/learning/learningEnv";
import type { GrowthAiFunnelStage } from "@/src/modules/messaging/growthAiStage";

export type ReplyContext = {
  name?: string;
  city?: string;
  listing_title?: string;
};

export function personalizeTemplate(body: string, ctx: ReplyContext): string {
  let out = body;
  const name = ctx.name?.trim() || "there";
  const city = ctx.city?.trim() || "your area";
  const listingTitle = ctx.listing_title?.trim() || "this listing";
  out = out.replace(/\{\{\s*name\s*\}\}/gi, name);
  out = out.replace(/\{\{\s*city\s*\}\}/gi, city);
  out = out.replace(/\{\{\s*listing_title\s*\}\}/gi, listingTitle);
  return out;
}

/** Stronger, still single-CTA copy when stage is closing or pressure is high (not for handoff / closing_push). */
export function applyClosingPressureTone(body: string): string {
  let out = body.trim();
  if (
    /\bI(?:'d)? recommend\b/i.test(out) ||
    /\bbest next step\b/i.test(out) ||
    /\bto avoid missing\b/i.test(out)
  ) {
    return out;
  }
  out = out.replace(/\bIf you want, I can help you complete this now\b/gi, "I'd recommend completing this now");
  out = out.replace(/\bIf you'd like, I can help you move forward quickly\b/gi, "I'd recommend the best next step");
  out = out.replace(/\bIf you want, I can help\b/gi, "I'd recommend we take the best next step");
  out = out.replace(/\bIf you'd like, I can help\b/gi, "I'd recommend we take the best next step");
  out = out.replace(/\bIf you want, we can do the next step together now\b/gi, "The best next step is to move forward now");
  out = out.replace(/\bso you don't lose the opportunity\b/gi, "to avoid missing it");
  out = out.replace(/\bso you don't lose it\b/gi, "to avoid missing it");
  return out;
}

function closingTemplateKeyByObjection(intent: AiIntent, objection: AiObjection): string {
  if (objection === "trust") return "trust_with_action";
  if (objection === "timing") return "timing_with_action";
  if (intent === "booking_interest") return "assist_close";
  return "next_step_call";
}

/** Pick rule: intent + objection (specific), then intent + null objection, then generic. */
export async function selectTemplateKey(intent: AiIntent, objection: AiObjection): Promise<string | null> {
  const rules = await prisma.autoReplyRule.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const match = (i: string, o: string | null) =>
    rules.find((r) => r.intent === i && (r.objection ?? null) === o);

  if (objection !== "none") {
    const row = match(intent, objection);
    if (row) return row.templateKey;
  }
  const fallbackIntent = match(intent, null);
  if (fallbackIntent) return fallbackIntent.templateKey;

  const generic = rules.find((r) => r.intent === "unclear" && r.objection == null);
  return generic?.templateKey ?? "generic_clarify";
}

/**
 * Stronger routing: high-intent closes, trust/timing + action, uncertainty split by stage,
 * price gated by AI_AUTO_REPLY_INCLUDE_PRICE (caller maps price → uncertainty when off).
 */
export async function selectTemplateKeyFromClassification(params: {
  intent: AiIntent;
  objection: AiObjection;
  highIntent: boolean;
  includePrice: boolean;
  /** Adaptive funnel stage for tone + routing. */
  stage?: GrowthAiFunnelStage;
  /** When ≥ 4, prefer assist_close / trust_with_action / timing_with_action. */
  pressureScore?: number;
}): Promise<string | null> {
  const { intent, objection, highIntent, includePrice, stage, pressureScore = 0 } = params;

  let obj = objection;
  if (!includePrice && obj === "price") {
    obj = "uncertainty";
  }

  const forceClosingTemplates =
    (stage === "closing" || pressureScore >= 4) &&
    intent !== "support_issue" &&
    intent !== "unclear";

  if (forceClosingTemplates) {
    return closingTemplateKeyByObjection(intent, obj);
  }

  if (stage === "high_intent" && highIntent) {
    if (obj === "trust") return "trust_with_action";
    if (obj === "timing") return "timing_with_action";
    if (obj === "none" && (intent === "booking_interest" || intent === "buyer_interest")) {
      return intent === "booking_interest" ? "assist_close" : "next_step_call";
    }
  }

  if (stage === "considering") {
    if (obj === "uncertainty") {
      if (intent === "booking_interest") return "booking_uncertainty";
      if (intent === "buyer_interest") return "buyer_uncertainty";
    }
    if (obj === "trust") {
      if (intent === "booking_interest") return "booking_trust_objection";
      if (intent === "buyer_interest") return "buyer_trust_objection";
    }
    if (obj === "timing") {
      if (intent === "booking_interest") return "booking_timing_objection";
      if (intent === "buyer_interest") return "buyer_timing_objection";
    }
  }

  if (stage === "engaged") {
    if (obj === "none" && intent === "buyer_interest") return "buyer_interest_open";
    if (obj === "none" && intent === "booking_interest") return "booking_interest_open";
  }

  if (highIntent) {
    if (obj === "trust") return "trust_with_action";
    if (obj === "timing") return "timing_with_action";
    if (obj === "none" && (intent === "booking_interest" || intent === "buyer_interest")) {
      return intent === "booking_interest" ? "assist_close" : "next_step_call";
    }
  }

  if (obj === "uncertainty") {
    if (intent === "booking_interest") return "booking_uncertainty";
    if (intent === "buyer_interest") return "buyer_uncertainty";
  }

  return selectTemplateKey(intent, obj);
}

export async function loadTemplate(templateKey: string) {
  return prisma.autoReplyTemplate.findUnique({ where: { templateKey } });
}

/** How the template was chosen (self-learning layer on top of rules). */
export type ReplySelectionSource = "forced" | "experiment" | "learning" | "default" | "manual";

export type GeneratedReply = {
  reply_text: string;
  template_key: string | null;
  cta_type: string;
  handoff_required: boolean;
  selection_source?: ReplySelectionSource;
  experiment_key?: string | null;
};

/**
 * Routing order: forced (e.g. closing_push) → manual admin override → experiment → self-learning → deterministic default.
 * Handoff is handled by the caller (always handoff_ack).
 */
export async function resolveAdaptiveTemplateSelection(params: {
  conversationId: string;
  forcedTemplateKey?: string | null;
  defaultTemplateKey: string;
  stage: string;
  intent: AiIntent;
  objection: AiObjection;
  highIntent: boolean;
  handoffRequired: boolean;
  pressureScore?: number;
  classifierSnapshot: Record<string, unknown>;
}): Promise<{
  templateKey: string;
  selectionSource: ReplySelectionSource;
  experimentKey: string | null;
  reasonJson: Record<string, unknown>;
}> {
  const ctx: LearningRoutingContext = {
    stage: normDim(params.stage),
    detectedIntent: normDim(params.intent),
    detectedObjection: normDim(params.objection),
    highIntent: params.highIntent,
  };

  const baseReason: Record<string, unknown> = {
    ...params.classifierSnapshot,
    stage: ctx.stage,
    pressureScore: params.pressureScore ?? null,
  };

  if (params.handoffRequired) {
    return {
      templateKey: "handoff_ack",
      selectionSource: "default",
      experimentKey: null,
      reasonJson: { ...baseReason, path: "handoff_safety" },
    };
  }

  if (params.forcedTemplateKey) {
    return {
      templateKey: params.forcedTemplateKey,
      selectionSource: "forced",
      experimentKey: null,
      reasonJson: { ...baseReason, forcedTemplate: true },
    };
  }

  try {
    const manual = await prisma.growthAiLearningManualOverride.findFirst({
      where: {
        isActive: true,
        stage: ctx.stage,
        detectedIntent: ctx.detectedIntent,
        detectedObjection: ctx.detectedObjection,
        highIntent: ctx.highIntent,
      },
    });
    if (manual) {
      return {
        templateKey: manual.overrideTemplateKey,
        selectionSource: "manual",
        experimentKey: null,
        reasonJson: { ...baseReason, manualOverrideId: manual.id },
      };
    }

    if (isExperimentFlowSafe(params.intent, params.objection)) {
      const exp = await getActiveExperimentForContext(ctx);
      if (exp) {
        const tpl = chooseExperimentTemplate(exp, params.conversationId, exp.allocationPercent);
        return {
          templateKey: tpl,
          selectionSource: "experiment",
          experimentKey: exp.experimentKey,
          reasonJson: {
            ...baseReason,
            experimentKey: exp.experimentKey,
            allocationPercent: exp.allocationPercent,
          },
        };
      }
    }

    if (isSelfLearningRoutingEnabled()) {
      const rec = await getLearningRecommendation(ctx, params.defaultTemplateKey);
      if (
        rec.recommendedTemplateKey &&
        rec.recommendedTemplateKey !== params.defaultTemplateKey &&
        rec.reason === "learner_prefers_alternative"
      ) {
        return {
          templateKey: rec.recommendedTemplateKey,
          selectionSource: "learning",
          experimentKey: null,
          reasonJson: {
            ...baseReason,
            learningReason: rec.reason,
            rankingTop: rec.ranking.slice(0, 5).map((r) => ({ k: r.templateKey, score: r.score })),
          },
        };
      }
    }
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code !== "P2021") throw e;
  }

  return {
    templateKey: params.defaultTemplateKey,
    selectionSource: "default",
    experimentKey: null,
    reasonJson: { ...baseReason, deterministicDefault: params.defaultTemplateKey },
  };
}

/**
 * One short reply + one CTA. If handoff, uses `handoff_ack` (must exist in DB seed).
 */
export async function generateReply(params: {
  intent: AiIntent;
  objection: AiObjection;
  handoffRequired: boolean;
  context: ReplyContext;
  /** When set (and not handoff), load this template instead of rule-based selection. */
  forcedTemplateKey?: string | null;
  /** Toughen wording for closing / high-pressure threads (never for handoff_ack / closing_push). */
  escalateClosingTone?: boolean;
  selectionSource?: ReplySelectionSource;
  experimentKey?: string | null;
}): Promise<GeneratedReply> {
  const {
    intent,
    objection,
    handoffRequired,
    context,
    forcedTemplateKey,
    escalateClosingTone,
    selectionSource,
    experimentKey,
  } = params;

  if (handoffRequired) {
    const tpl = await loadTemplate("handoff_ack");
    const text = tpl
      ? personalizeTemplate(tpl.content, context)
      : `Thanks for the note, ${context.name?.trim() || "there"} — I'm looping in a teammate to help with this directly.`;
    return {
      reply_text: text,
      template_key: tpl?.templateKey ?? "handoff_ack",
      cta_type: tpl?.ctaType ?? "human",
      handoff_required: true,
      selection_source: selectionSource ?? "default",
      experiment_key: experimentKey ?? null,
    };
  }

  if (forcedTemplateKey) {
    const tpl = await loadTemplate(forcedTemplateKey);
    if (tpl) {
      let text = personalizeTemplate(tpl.content, context);
      if (
        escalateClosingTone &&
        forcedTemplateKey !== "closing_push" &&
        forcedTemplateKey !== "handoff_ack"
      ) {
        text = applyClosingPressureTone(text);
      }
      return {
        reply_text: text,
        template_key: tpl.templateKey,
        cta_type: tpl.ctaType,
        handoff_required: false,
        selection_source: selectionSource ?? "default",
        experiment_key: experimentKey ?? null,
      };
    }
  }

  const key = await selectTemplateKey(intent, objection);
  if (!key) {
    return {
      reply_text: personalizeTemplate(
        "Totally fair — what would help most right now: a quick comparison, more detail on the listing, or timing for a call?",
        context
      ),
      template_key: null,
      cta_type: "reply_yes",
      handoff_required: false,
      selection_source: selectionSource ?? "default",
      experiment_key: experimentKey ?? null,
    };
  }

  const tpl = await loadTemplate(key);
  if (!tpl) {
    let fallback = personalizeTemplate(
      "Thanks for reaching out. What's the one thing you'd like to figure out first — price, timing, or trust/safety?",
      context
    );
    if (escalateClosingTone) fallback = applyClosingPressureTone(fallback);
    return {
      reply_text: fallback,
      template_key: key,
      cta_type: "inquiry",
      handoff_required: false,
      selection_source: selectionSource ?? "default",
      experiment_key: experimentKey ?? null,
    };
  }

  let body = personalizeTemplate(tpl.content, context);
  if (escalateClosingTone && key !== "closing_push") {
    body = applyClosingPressureTone(body);
  }

  return {
    reply_text: body,
    template_key: tpl.templateKey,
    cta_type: tpl.ctaType,
    handoff_required: false,
    selection_source: selectionSource ?? "default",
    experiment_key: experimentKey ?? null,
  };
}
