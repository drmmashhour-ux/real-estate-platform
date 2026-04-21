import { logInfo } from "@/lib/logger";

export const executiveLog = {
  orchestrator: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[executive-orchestrator] ${msg}`, meta),
  router: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-router] ${msg}`, meta),
  task: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-task] ${msg}`, meta),
  policy: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-policy] ${msg}`, meta),
  conflict: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-conflict] ${msg}`, meta),
  memory: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-memory] ${msg}`, meta),
  briefing: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-briefing] ${msg}`, meta),
  approval: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-approval] ${msg}`, meta),
  monitoring: (msg: string, meta?: Record<string, unknown>) => logInfo(`[executive-monitoring] ${msg}`, meta),
  agentAcquisition: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-acquisition] ${msg}`, meta),
  agentEsg: (msg: string, meta?: Record<string, unknown>) => logInfo(`[agent-esg] ${msg}`, meta),
  agentLegal: (msg: string, meta?: Record<string, unknown>) => logInfo(`[agent-legal] ${msg}`, meta),
  agentFinancing: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-financing] ${msg}`, meta),
  agentCommittee: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-committee] ${msg}`, meta),
  agentClosing: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-closing] ${msg}`, meta),
  agentAssetOps: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-asset-ops] ${msg}`, meta),
  agentPortfolio: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-portfolio] ${msg}`, meta),
  agentInvestorReporting: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-investor-reporting] ${msg}`, meta),
  agentGrowth: (msg: string, meta?: Record<string, unknown>) =>
    logInfo(`[agent-growth] ${msg}`, meta),
};
