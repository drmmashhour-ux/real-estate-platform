/** Manager AI observability rows — slim shape for feeds without `@prisma/client`. */

export type ManagerAiAgentRunRow = {
  id: string;
  agentKey: string;
  status: string;
  createdAt: Date | string;
  outputSummary: string | null;
};
