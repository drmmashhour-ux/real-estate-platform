/** Feature flags + adapter selection for BNHUB → TikTok / video / scheduler pipeline */

export function isContentPipelineEnabled(): boolean {
  return process.env.CONTENT_PIPELINE_ENABLED === "1";
}

/** Regenerate on listing update (throttled). Default off — set to 1 with CONTENT_PIPELINE_MIN_INTERVAL_MS */
export function isContentPipelineOnUpdateEnabled(): boolean {
  return process.env.CONTENT_PIPELINE_ON_UPDATE === "1";
}

/** Also run for DRAFT listings (dev / QA). Production should leave unset (published only). */
export function contentPipelineIncludeDrafts(): boolean {
  return process.env.CONTENT_PIPELINE_INCLUDE_DRAFTS === "1";
}

export function contentPipelineMinIntervalMs(): number {
  const raw = process.env.CONTENT_PIPELINE_MIN_INTERVAL_MS;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 60 * 60 * 1000;
}

export type VideoToolName = "runway" | "pictory" | "none";

export function getVideoTool(): VideoToolName {
  const v = (process.env.VIDEO_TOOL ?? "none").toLowerCase().trim();
  if (v === "runway" || v === "pictory") return v;
  return "none";
}

export type SchedulerName = "metricool" | "later" | "none";

export function getSocialScheduler(): SchedulerName {
  const v = (process.env.SOCIAL_SCHEDULER ?? "none").toLowerCase().trim();
  if (v === "metricool" || v === "later") return v;
  return "none";
}

/** Target posts per calendar day when scheduling (best-effort; adapters may ignore). */
export function schedulerPostsPerDayTarget(): number {
  const raw = process.env.SOCIAL_POSTS_PER_DAY;
  const n = raw ? Number.parseInt(raw, 10) : 3;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}
