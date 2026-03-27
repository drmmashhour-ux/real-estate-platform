import type { Request, Response } from "express";
import { getDecisions, applyHumanOverride, getDecisionById } from "../services/decision-store.js";
import { humanOverrideSchema } from "../validators.js";
import type { AgentType } from "../models/decisions.js";

export function getDecisionsList(req: Request, res: Response): void {
  const agentType = req.query.agentType as AgentType | undefined;
  const entityType = req.query.entityType as string | undefined;
  const entityId = req.query.entityId as string | undefined;
  const limit = req.query.limit != null ? Number(req.query.limit) : 50;
  const offset = req.query.offset != null ? Number(req.query.offset) : 0;
  const decisions = getDecisions({ agentType, entityType, entityId, limit, offset });
  res.json({ decisions });
}

export function postDecisionOverride(req: Request, res: Response): void {
  const id = req.params.id;
  const parsed = humanOverrideSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const decision = getDecisionById(id);
  if (!decision) {
    res.status(404).json({ error: "Decision not found" });
    return;
  }
  const override = {
    overrideBy: parsed.data.overrideBy,
    overrideAt: new Date().toISOString(),
    originalAction: decision.recommendedAction,
    newAction: parsed.data.newAction,
    notes: parsed.data.notes,
  };
  const updated = applyHumanOverride(id, override);
  res.json(updated);
}
