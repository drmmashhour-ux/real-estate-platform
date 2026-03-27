import { scheduleRecertificationJob } from "@/lib/trustgraph/infrastructure/services/recertificationService";

export async function scheduleRecertification(args: Parameters<typeof scheduleRecertificationJob>[0]) {
  return scheduleRecertificationJob(args);
}
