import { getScriptByCategory } from "@/modules/sales-scripts/sales-script.service";
import type { ScriptContext } from "@/modules/sales-scripts/sales-script.types";

import type { CallAssistantContext, CallStage, NextLineResult } from "./call-assistant.types";
import { detectObjectionFromProspectText, getObjectionReplies, type ObjectionKeywordId } from "./call-objection.service";

function buildScriptCtx(audience: CallAssistantContext["audience"], scriptContext?: ScriptContext): ScriptContext {
  return {
    audience,
    ...scriptContext,
  };
}

/**
 * Real-time “what to say next” — deterministic from approved script copy + objection library.
 * Does not auto-dial or generate claims beyond configured lines.
 */
export function getNextLine(ctx: CallAssistantContext): NextLineResult {
  const scriptCtx = buildScriptCtx(ctx.audience, ctx.scriptContext);
  const script = getScriptByCategory(ctx.scriptCategory, scriptCtx);
  const reminder = script.rep_reminder;

  const objection = detectObjectionFromProspectText(ctx.lastProspectInput);
  if (objection) {
    const replies = getObjectionReplies(script, objection.id as ObjectionKeywordId);
    return {
      suggested: replies[0] ?? script.fallback_lines[0] ?? script.closing_line,
      alternatives: replies.slice(1),
      stage: "objection",
      objectionLabel: objection.label,
      reminder,
    };
  }

  if (ctx.stage === "objection") {
    const lines = script.objection_handling.map((o) => o.line).filter(Boolean);
    const suggested = lines[0] ?? script.fallback_lines[0] ?? script.closing_line;
    const pool = [...lines.slice(1), ...script.fallback_lines].filter((l) => l && l !== suggested);
    return {
      suggested,
      alternatives: pool.slice(0, 3),
      stage: "objection",
      reminder,
    };
  }

  switch (ctx.stage) {
    case "opening":
      return {
        suggested: script.opening_line,
        alternatives: [script.hook, script.fallback_lines[0] ?? script.closing_line],
        stage: "opening",
        reminder,
      };
    case "pitch":
      return {
        suggested: script.hook,
        alternatives: [
          script.value_proposition,
          ...(script.pitch_points?.slice(0, 2).map((p) => `One piece of the stack: ${p}.`) ?? []),
        ],
        stage: "pitch",
        reminder,
      };
    case "discovery": {
      const idx = ctx.discoveryIndex ?? 0;
      const q = script.discovery_questions[idx];
      const nextQ = script.discovery_questions[idx + 1];
      return {
        suggested: q ?? script.closing_line,
        alternatives: nextQ ? [nextQ, script.closing_line] : [script.closing_line, script.fallback_lines[0] ?? ""],
        stage: "discovery",
        reminder,
      };
    }
    case "closing":
      return {
        suggested: script.closing_line,
        alternatives: script.fallback_lines.slice(0, 2),
        stage: "closing",
        reminder,
      };
    default:
      return {
        suggested: script.opening_line,
        alternatives: [script.hook],
        stage: "opening",
        reminder,
      };
  }
}

/** After user delivers the suggested line, advance stage (deterministic). */
export function advanceStageAfterLine(current: CallStage, ctx: CallAssistantContext): CallStage {
  if (current === "opening") return "pitch";
  if (current === "pitch") return "discovery";
  if (current === "discovery") {
    const script = getScriptByCategory(ctx.scriptCategory, buildScriptCtx(ctx.audience, ctx.scriptContext));
    const idx = ctx.discoveryIndex ?? 0;
    if (idx + 1 < script.discovery_questions.length) return "discovery";
    return "closing";
  }
  if (current === "objection") return "closing";
  if (current === "closing") return "closing";
  return current;
}

/** Bump discovery question index while staying in discovery; clamp at last index. */
export function nextDiscoveryIndex(ctx: CallAssistantContext): number {
  const script = getScriptByCategory(ctx.scriptCategory, buildScriptCtx(ctx.audience, ctx.scriptContext));
  const idx = ctx.discoveryIndex ?? 0;
  if (idx + 1 < script.discovery_questions.length) return idx + 1;
  return Math.max(0, script.discovery_questions.length - 1);
}
