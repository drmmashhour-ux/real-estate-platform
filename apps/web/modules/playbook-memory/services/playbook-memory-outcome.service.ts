import type { RecordOutcomeUpdateInput } from "../types/playbook-memory.types";
import { playbookMemoryWriteService } from "./playbook-memory-write.service";

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
};
