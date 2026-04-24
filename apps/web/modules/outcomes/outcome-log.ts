import { commandCenterFlags } from "@/config/feature-flags";

import { recordOutcome } from "./outcome.service";
import type { OutcomeEntityType, OutcomeLogCaptureHint, OutcomeSource } from "./outcome.types";

type Tag =
  | "[api]"
  | "[stripe]"
  | "[payment]"
  | "[booking]"
  | "[autopilot]"
  | "[compliance]"
  | "[compliance:oaciq]"
  | "[compliance:conflict]"
  | "[deal]"
  | "[lead]"
  | "[transaction]"
  | "[tax]"
  | "[playbook]"
  | "[finance-admin]"
  | "[investment-compliance]";

function tagToSource(tag: Tag): OutcomeSource {
  if (tag === "[stripe]" || tag === "[payment]") return "log_hook";
  if (tag === "[compliance]" || tag === "[compliance:oaciq]" || tag === "[compliance:conflict]") return "log_hook";
  if (tag === "[booking]") return "log_hook";
  if (tag === "[deal]") return "deal_intelligence";
  if (tag === "[lead]") return "log_hook";
  if (tag === "[playbook]") return "log_hook";
  return "log_hook";
}

function inferFromMessage(
  tag: Tag,
  msg: string,
  payload: Record<string, unknown> | undefined,
): { entityType: OutcomeEntityType; entityId: string; action: string } | null {
  if (!payload) return null;
  const leadId = typeof payload.leadId === "string" ? payload.leadId : null;
  const visitId = typeof payload.visitId === "string" ? payload.visitId : null;
  if (tag === "[lead]" && msg.toLowerCase().includes("lead created") && leadId) {
    return { entityType: "lead", entityId: leadId, action: "lead_created" };
  }
  if (tag === "[compliance:oaciq]" && msg.includes("disclosure")) {
    const sid = typeof payload.sessionId === "string" ? payload.sessionId : "unknown";
    return { entityType: "compliance", entityId: sid, action: msg.replace(/\s+/g, "_").toLowerCase().slice(0, 80) };
  }
  if (tag === "[compliance:conflict]" && (msg.includes("conflict") || msg.includes("consent"))) {
    const dealId = typeof payload.dealId === "string" ? payload.dealId : "unknown";
    return { entityType: "compliance", entityId: dealId, action: msg.replace(/\s+/g, "_").toLowerCase().slice(0, 80) };
  }
  if (tag === "[stripe]" || tag === "[payment]") {
    const id = typeof payload.id === "string" ? payload.id : (typeof payload.objectId === "string" ? payload.objectId : "event");
    return { entityType: "payment", entityId: id.slice(0, 64), action: "stripe_event" };
  }
  if (tag === "[booking]" && visitId) {
    return { entityType: "booking", entityId: visitId, action: msg.toLowerCase().replace(/\s+/g, "_").slice(0, 80) };
  }
  return null;
}

/**
 * Called from `launch-logger` after each tagged line. Never throws; failures are logged.
 */
export function tryCaptureFromTaggedLog(
  tag: Tag,
  level: "info" | "warn" | "error",
  msg: string,
  payload?: Record<string, unknown>,
): void {
  if (!commandCenterFlags.outcomeFeedbackLoopV1) return;
  if (level === "error") return;

  const hint = payload?.outcomeHint as OutcomeLogCaptureHint | undefined;
  if (payload?.outcomeHint && !hint?.capture) {
    return;
  }
  if (hint?.capture) {
    void recordOutcome({
      entityType: hint.entityType,
      entityId: hint.entityId,
      actionTaken: hint.actionTaken,
      predictedOutcome: hint.predictedOutcome,
      actualOutcome: hint.actualOutcome,
      source: hint.source ?? tagToSource(tag),
      logTag: tag,
      logMessage: msg.slice(0, 500),
      contextUserId: hint.contextUserId,
    }).then((r) => {
      if (!r.ok) console.error("[lecipm][outcome] log hook hint failed", r);
    });
    return;
  }

  const inferred = inferFromMessage(tag, msg, payload);
  if (!inferred) return;

  void recordOutcome({
    entityType: inferred.entityType,
    entityId: inferred.entityId,
    actionTaken: inferred.action,
    source: tagToSource(tag),
    logTag: tag,
    logMessage: msg.slice(0, 500),
    contextUserId: typeof payload?.userId === "string" ? payload.userId : undefined,
  }).then((r) => {
    if (!r.ok) console.error("[lecipm][outcome] log hook inferred failed", r);
  });
}
