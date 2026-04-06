/**
 * Placeholder for cron / queue integration: debounced refresh jobs per entity.
 * Wire to Vercel cron or worker when growth automation is enabled.
 */
export function scheduleContentRefreshJob(input: {
  entityType: string;
  entityId: string;
  reason: string;
  notBeforeMs?: number;
}): { jobKey: string; scheduled: boolean } {
  const jobKey = `${input.entityType}:${input.entityId}:${input.reason}`;
  return { jobKey, scheduled: false };
}
