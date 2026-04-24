import { prisma } from "@/lib/db";
import { ActionPipelineStatus } from "@prisma/client";

export class AutopilotExecutionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutopilotExecutionBlockedError";
  }
}

function strictGateEnabled(): boolean {
  return process.env.LECIPM_AUTOPILOT_SIGNATURE_GATE === "1" || process.env.LECIPM_AUTOPILOT_SIGNATURE_GATE === "true";
}

/**
 * Outbound automation (email, offer submit, closing, etc.) must pass a completed action pipeline when strict gate is on.
 * Set `LECIPM_AUTOPILOT_SIGNATURE_GATE=true` in production to enforce.
 */
export async function assertAutopilotOutboundAllowed(input: {
  operation: string;
  /** When strict gate is on, this must reference an EXECUTED action pipeline row. */
  actionPipelineId?: string | null;
}): Promise<void> {
  if (!strictGateEnabled()) return;
  if (!input.actionPipelineId?.trim()) {
    throw new AutopilotExecutionBlockedError(
      `${input.operation}: blocked — no action pipeline id (AI autopilot requires broker-signed execution record).`,
    );
  }
  const row = await prisma.actionPipeline.findUnique({
    where: { id: input.actionPipelineId.trim() },
    select: { status: true },
  });
  if (!row || row.status !== ActionPipelineStatus.EXECUTED) {
    throw new AutopilotExecutionBlockedError(
      `${input.operation}: blocked — action pipeline must be EXECUTED (broker signed). Current: ${row?.status ?? "missing"}.`,
    );
  }
}

/** Blocks mutation unless the pipeline has been broker-signed and executed. */
export async function assertActionPipelineExecuted(actionPipelineId: string): Promise<void> {
  const row = await prisma.actionPipeline.findUnique({
    where: { id: actionPipelineId },
    select: { status: true },
  });
  if (!row || row.status !== ActionPipelineStatus.EXECUTED) {
    throw new AutopilotExecutionBlockedError(
      `Action pipeline ${actionPipelineId} is not EXECUTED — broker signature gate.`,
    );
  }
}
