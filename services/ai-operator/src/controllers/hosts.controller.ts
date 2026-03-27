import type { Request, Response } from "express";
import { analyzeHost } from "../services/operator-service.js";
import { getDecisions } from "../services/decision-store.js";
import { hostAnalyzeSchema } from "../validators.js";

export function postHostsAnalyze(req: Request, res: Response): void {
  const parsed = hostAnalyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = analyzeHost(parsed.data as Parameters<typeof analyzeHost>[0]);
  res.json(output);
}

export function getHostById(req: Request, res: Response): void {
  const hostId = req.params.hostId;
  const decisions = getDecisions({ agentType: "host_performance", entityType: "host", entityId: hostId, limit: 1 });
  const last = decisions[0];
  if (!last) {
    res.status(404).json({ error: "No host analysis found for this host" });
    return;
  }
  res.json(last.outputSummary);
}
