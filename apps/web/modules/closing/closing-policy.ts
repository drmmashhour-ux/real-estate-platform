import type { Deal } from "@prisma/client";
import { normalizeState } from "@/modules/execution/execution-state-machine";
import type { ExecutionPipelineState } from "@/modules/execution/execution.types";

/**
 * Deal may enter the closing room when execution has reached the final window.
 *
 * Product framing: READY (execution approved for closing) → CLOSING phase is represented by
 * `DealClosing.status = IN_PROGRESS` plus transactional `Deal.status = closing_scheduled`.
 * The execution enum has no separate `CLOSING` state between `closing_ready` and `closed`;
 * the closing room session carries the in-flight closing work until confirmation moves pipeline to `closed`.
 *
 * Maps product language "APPROVED / EXECUTION → CLOSING" to LECIPM pipeline states:
 * - `closing_ready`: execution approved for closing (primary "READY" gate)
 * - `conditions_pending`: still clearing conditions but may open the secure room under broker control
 * - `fully_signed`: signature path complete; room can open to collect final lender/room steps
 */
const PIPELINE_ALLOW_START_CLOSING: ExecutionPipelineState[] = [
  "closing_ready",
  "conditions_pending",
  "fully_signed",
];

/** Pipeline stages where the secure closing room may be opened (final execution window). */
export function dealPipelineEligibleForClosingRoom(
  pipelineState: ExecutionPipelineState | null | undefined,
): boolean {
  const p = normalizeState(pipelineState);
  return PIPELINE_ALLOW_START_CLOSING.includes(p);
}

export function dealDealStatusAllowsClosing(deal: Pick<Deal, "status">): boolean {
  const s = deal.status;
  return s !== "closed" && s !== "cancelled";
}

export function canStartClosingSession(
  deal: Pick<Deal, "status" | "lecipmExecutionPipelineState">,
): { ok: true } | { ok: false; reason: string } {
  if (!dealDealStatusAllowsClosing(deal)) {
    return { ok: false, reason: "Deal is already closed or cancelled." };
  }
  if (!dealPipelineEligibleForClosingRoom(deal.lecipmExecutionPipelineState)) {
    return {
      ok: false,
      reason:
        "Closing room opens when execution pipeline is closing_ready, conditions_pending, or fully_signed.",
    };
  }
  return { ok: true };
}
