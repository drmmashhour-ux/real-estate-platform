import { z } from "zod";

const num = (v: string | undefined, fallback: number) => {
  const n = v != null && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const phase7EnterpriseConfigSchema = z.object({
  sla: z.object({
    dueSoonHoursBeforeDue: z.number().min(0),
    defaultLegalQueueDueHours: z.number().min(1),
    defaultEscalationAfterHours: z.number().min(1),
  }),
  documentApproval: z.object({
    defaultStepKinds: z.array(z.string()),
  }),
  portfolio: z.object({
    minListingsForPercent: z.number().int().min(0),
  }),
  safeEnterpriseLabels: z.object({
    workspaceQueue: z.string(),
    legalReview: z.string(),
    portfolioReady: z.string(),
  }),
});

export type Phase7EnterpriseConfig = z.infer<typeof phase7EnterpriseConfigSchema>;

export function getPhase7EnterpriseConfig(): Phase7EnterpriseConfig {
  const raw: Phase7EnterpriseConfig = {
    sla: {
      dueSoonHoursBeforeDue: num(process.env.TRUSTGRAPH_SLA_DUE_SOON_HOURS, 2),
      defaultLegalQueueDueHours: Math.max(1, Math.floor(num(process.env.TRUSTGRAPH_LEGAL_QUEUE_DUE_HOURS, 48))),
      defaultEscalationAfterHours: Math.max(1, Math.floor(num(process.env.TRUSTGRAPH_SLA_ESCALATE_AFTER_HOURS, 72))),
    },
    documentApproval: {
      defaultStepKinds: (process.env.TRUSTGRAPH_DOC_APPROVAL_STEPS?.trim() || "review,legal_review,final_approval")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
    portfolio: {
      minListingsForPercent: Math.max(0, Math.floor(num(process.env.TRUSTGRAPH_PORTFOLIO_MIN_LISTINGS, 1))),
    },
    safeEnterpriseLabels: {
      workspaceQueue: "Team review queue",
      legalReview: "Legal review",
      portfolioReady: "Portfolio verification overview",
    },
  };
  return phase7EnterpriseConfigSchema.parse(raw);
}
