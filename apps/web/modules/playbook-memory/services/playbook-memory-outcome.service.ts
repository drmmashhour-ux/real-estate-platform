import type { RecordOutcomeUpdateInput } from "../types/playbook-memory.types";
import { playbookMemoryWriteService } from "./playbook-memory-write.service";
import { playbookMemoryAssignmentService } from "./playbook-memory-assignment.service";

export const playbookMemoryOutcomeService = {
  async markSucceeded(input: Omit<RecordOutcomeUpdateInput, "outcomeStatus">) {
    return playbookMemoryWriteService.recordOutcomeUpdate({
      ...input,
      outcomeStatus: "SUCCEEDED",
    });
  },

  async markFailed(input: Omit<RecordOutcomeUpdateInput, "outcomeStatus">) {
    return playbookMemoryWriteService.recordOutcomeUpdate({
      ...input,
      outcomeStatus: "FAILED",
    });
  },

  async markPartial(input: Omit<RecordOutcomeUpdateInput, "outcomeStatus">) {
    return playbookMemoryWriteService.recordOutcomeUpdate({
      ...input,
      outcomeStatus: "PARTIAL",
    });
  },

  async markNeutral(input: Omit<RecordOutcomeUpdateInput, "outcomeStatus">) {
    return playbookMemoryWriteService.recordOutcomeUpdate({
      ...input,
      outcomeStatus: "NEUTRAL",
    });
  },

  /** Bandit: update assignment + stat row when a memory record outcome is recorded (idempotent, never throws from attach). */
  async syncAssignmentAfterOutcome(
    p: Parameters<typeof playbookMemoryAssignmentService.attachAssignmentOutcome>[0],
  ) {
    return playbookMemoryAssignmentService.attachAssignmentOutcome(p);
  },
};
