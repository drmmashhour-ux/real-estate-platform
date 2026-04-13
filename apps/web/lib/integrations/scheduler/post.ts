import { scheduleWithMetricool } from "./metricool";
import { resolveBufferCredentials, scheduleBufferUpdate } from "./buffer";

export type SchedulerPreference = "metricool" | "buffer" | "auto";

/**
 * Schedule content to external networks (TikTok/Instagram via third-party scheduler; official APIs only).
 */
export async function scheduleForExternalPlatforms(args: {
  userId: string;
  caption: string;
  mediaUrls: string[];
  scheduledAt: Date;
  platforms: ("tiktok" | "instagram" | "facebook")[];
  preference?: SchedulerPreference;
}): Promise<
  | { ok: true; provider: "metricool" | "buffer"; externalId?: string; raw?: unknown }
  | { ok: false; error: string }
> {
  const preference = args.preference ?? (process.env.SCHEDULER_PROVIDER as SchedulerPreference) ?? "auto";

  async function tryBuffer(): Promise<
    | { ok: true; provider: "buffer"; externalId?: string; raw?: unknown }
    | { ok: false; error: string }
    | null
  > {
    const creds = await resolveBufferCredentials(args.userId);
    if (!creds || !args.mediaUrls[0]) return null;
    const r = await scheduleBufferUpdate({
      accessToken: creds.accessToken,
      profileIds: creds.profileIds,
      caption: args.caption,
      mediaUrl: args.mediaUrls[0],
      scheduledAt: args.scheduledAt,
    });
    if (r.ok) return { ok: true, provider: "buffer", externalId: r.externalId, raw: r.raw };
    return { ok: false, error: r.error };
  }

  if (preference === "buffer") {
    const b = await tryBuffer();
    if (!b) {
      return { ok: false, error: "Buffer not configured (token + BUFFER_PROFILE_IDS or social account)" };
    }
    return b;
  }

  if (preference === "auto") {
    const b = await tryBuffer();
    if (b?.ok) return b;
  }

  const m = await scheduleWithMetricool({
    caption: args.caption,
    mediaUrls: args.mediaUrls,
    scheduledAt: args.scheduledAt,
    platforms: args.platforms,
  });
  if (m.ok) {
    return { ok: true, provider: "metricool", externalId: m.externalId, raw: m.raw };
  }
  return { ok: false, error: m.error };
}
