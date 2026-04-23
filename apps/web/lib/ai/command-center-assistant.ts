import type { DashboardMetrics } from "@/lib/compliance/dashboard-metrics";

export type CommandCenterAIInput = {
  metrics: DashboardMetrics;
  alerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    title: string;
    description: string;
    createdAt: Date | string;
  }>;
  executiveStatus: string;
  executiveView?: {
    systemHealth: string;
    complianceGrade: string | null;
    readinessForInspection: string;
  };
};

export function buildCommandCenterAI(input: CommandCenterAIInput): string {
  return `
You are assisting a compliance executive.

Rules:
- Highlight urgent risks
- Suggest priorities
- Do not suppress alerts

Data:
${JSON.stringify(input)}
`.trim();
}
