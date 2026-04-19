/**
 * 48h closing playbook — operator-confirmed checkpoints only (no forced workflow).
 */

import { recordFastDealSourceEvent } from "@/modules/growth/fast-deal-results.service";

export async function logPlaybookStepAcknowledged(input: {
  step: number;
  playbookKey?: string;
  actorUserId?: string | null;
  leadId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "closing_playbook",
    sourceSubType: "step_acknowledged",
    actorUserId: input.actorUserId,
    metadata: {
      step: input.step,
      playbookKey: input.playbookKey ?? "48h_closing",
      ...(input.leadId ? { leadId: input.leadId } : {}),
    },
  });
}

export async function logPlaybookStepCompleted(input: {
  step: number;
  playbookKey?: string;
  actorUserId?: string | null;
  leadId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "closing_playbook",
    sourceSubType: "step_completed",
    actorUserId: input.actorUserId,
    metadata: {
      step: input.step,
      playbookKey: input.playbookKey ?? "48h_closing",
      ...(input.leadId ? { leadId: input.leadId } : {}),
    },
  });
}

export async function logPlaybookSessionCompleted(input: {
  playbookKey?: string;
  actorUserId?: string | null;
  leadId?: string | null;
}): Promise<{ id: string } | null> {
  return recordFastDealSourceEvent({
    sourceType: "closing_playbook",
    sourceSubType: "playbook_session_completed",
    actorUserId: input.actorUserId,
    metadata: {
      playbookKey: input.playbookKey ?? "48h_closing",
      ...(input.leadId ? { leadId: input.leadId } : {}),
    },
  });
}
