import { ContentAutomationJobStatus } from "@prisma/client";

/** Allowed forward transitions for observability / guards */
export const JOB_STATE_FLOW: Partial<Record<ContentAutomationJobStatus, ContentAutomationJobStatus[]>> = {
  [ContentAutomationJobStatus.QUEUED]: [
    ContentAutomationJobStatus.GENERATING_COPY,
    ContentAutomationJobStatus.FAILED,
  ],
  [ContentAutomationJobStatus.GENERATING_COPY]: [
    ContentAutomationJobStatus.GENERATING_VIDEO,
    ContentAutomationJobStatus.READY,
    ContentAutomationJobStatus.FAILED,
  ],
  [ContentAutomationJobStatus.GENERATING_VIDEO]: [
    ContentAutomationJobStatus.READY,
    ContentAutomationJobStatus.FAILED,
  ],
  [ContentAutomationJobStatus.READY]: [
    ContentAutomationJobStatus.SCHEDULED,
    ContentAutomationJobStatus.PUBLISHED,
    ContentAutomationJobStatus.FAILED,
  ],
  [ContentAutomationJobStatus.SCHEDULED]: [ContentAutomationJobStatus.PUBLISHED, ContentAutomationJobStatus.FAILED],
  [ContentAutomationJobStatus.PUBLISHED]: [],
  [ContentAutomationJobStatus.FAILED]: [ContentAutomationJobStatus.QUEUED],
};

export function canTransition(
  from: ContentAutomationJobStatus,
  to: ContentAutomationJobStatus
): boolean {
  const next = JOB_STATE_FLOW[from];
  return Boolean(next?.includes(to));
}
