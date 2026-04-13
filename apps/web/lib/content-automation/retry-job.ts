import { appendContentJobLog } from "./job-log";
import { runContentAutomationPipeline } from "./run-job";

export async function retryContentJob(jobId: string, opts?: { skipVideo?: boolean }): Promise<{
  ok: boolean;
  error?: string;
}> {
  await appendContentJobLog({
    contentJobId: jobId,
    eventType: "retry",
    message: "Retry requested",
    metadataJson: { skipVideo: opts?.skipVideo ?? false },
  });
  return runContentAutomationPipeline({ jobId, skipVideo: opts?.skipVideo });
}
