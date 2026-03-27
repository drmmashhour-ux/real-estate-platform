import { executeRecertificationJob } from "@/lib/trustgraph/infrastructure/services/recertificationService";

export async function runRecertificationCheck(jobId: string) {
  return executeRecertificationJob(jobId);
}
