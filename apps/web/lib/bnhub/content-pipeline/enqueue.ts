import { runListingContentPipeline } from "@/lib/bnhub/content-pipeline/run-pipeline";
import { isContentPipelineEnabled, isContentPipelineOnUpdateEnabled } from "@/lib/bnhub/content-pipeline/env";
import { isContentMachineEnabled } from "@/lib/content-machine/env";
import { runContentMachineForListing } from "@/lib/content-machine/pipeline";

/**
 * Non-blocking enqueue (does not delay HTTP responses).
 * - `CONTENT_PIPELINE_ENABLED=1` → legacy TikTok pack + optional video tool row (`content_generated`).
 * - `CONTENT_MACHINE_ENABLED=1` without pipeline → 5-style machine only (`generated_contents`).
 * - When both are on, the content machine runs from the pipeline hook (not duplicated here).
 */
export function enqueueListingContentPipeline(
  listingId: string,
  trigger: "create" | "update" | "manual"
): void {
  if (isContentPipelineEnabled()) {
    if (trigger === "update" && !isContentPipelineOnUpdateEnabled()) return;

    const run = () =>
      runListingContentPipeline(listingId, trigger).catch((err) => {
        console.error("[content-pipeline]", listingId, err);
      });

    if (typeof setImmediate !== "undefined") {
      setImmediate(run);
    } else {
      void Promise.resolve().then(run);
    }
    return;
  }

  if (isContentMachineEnabled()) {
    const runMachine = () =>
      runContentMachineForListing(listingId, { force: false }).catch((err) => {
        console.error("[content-machine]", listingId, err);
      });
    if (typeof setImmediate !== "undefined") {
      setImmediate(runMachine);
    } else {
      void Promise.resolve().then(runMachine);
    }
  }
}
