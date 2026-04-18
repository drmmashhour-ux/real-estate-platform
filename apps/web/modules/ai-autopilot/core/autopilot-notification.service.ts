/**
 * v1 stub — wire to existing notification / email pipelines when product wants digests.
 * Does not send by default.
 */
export function scheduleAutopilotDigest(_userId: string, _payload: { title: string; body: string }) {
  return { scheduled: false as const, reason: "notifications_not_wired_in_v1" };
}
