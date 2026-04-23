/**
 * Resolution & messaging — re-exports platform dispute-room engine (single source of truth).
 */
export {
  escalateDispute,
  postDisputeMessage,
  proposeResolution,
  setDisputeStatus,
} from "@/modules/dispute-room/dispute-case.service";
