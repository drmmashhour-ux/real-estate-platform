import type { AvatarProfileLike, AvatarVideoGenerationResult } from "@/src/modules/ai-avatar/domain/avatar.types";
import {
  getDidConfig,
  getHeyGenConfig,
  getLecipmAvatarVideoProvider,
  shouldSyncPollVideo,
  syncPollMaxMs,
} from "@/src/modules/ai-avatar/infrastructure/providers/productionAvatarEnv";
import { didCreateTalk, didPollUntilDone } from "@/src/modules/ai-avatar/infrastructure/providers/didVideoProvider";
import { heygenCreateAvatarVideo, heygenPollUntilDone } from "@/src/modules/ai-avatar/infrastructure/providers/heygenVideoProvider";

function cfgString(cfg: Record<string, unknown> | null, key: string): string | undefined {
  if (!cfg) return undefined;
  const v = cfg[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Production path: HeyGen or D-ID async jobs from script text + env (and optional profile.styleConfig overrides).
 * Static path: if `profile.videoBaseUrl` is set and provider is `none`, return CDN URL immediately.
 */
export async function generateAvatarVideo(
  scriptText: string,
  profile: AvatarProfileLike
): Promise<AvatarVideoGenerationResult> {
  const provider = getLecipmAvatarVideoProvider();
  const staticUrl = profile.videoBaseUrl?.trim() || null;

  if (provider === "none") {
    if (staticUrl) {
      return {
        mode: "static_cdn",
        videoUrl: staticUrl,
        externalProvider: null,
        externalJobId: null,
      };
    }
    return {
      mode: "placeholder",
      videoUrl: null,
      externalProvider: null,
      externalJobId: null,
      message: "Set LECIPM_AVATAR_VIDEO_PROVIDER and vendor keys, or configure avatar_profiles.video_base_url.",
    };
  }

  const style = profile.styleConfig;
  const sync = shouldSyncPollVideo();
  const maxMs = syncPollMaxMs();

  if (provider === "heygen") {
    const env = getHeyGenConfig();
    const avatarId = cfgString(style, "heygenAvatarId") ?? env.avatarId;
    const voiceId = profile.voiceProfileId?.trim() || cfgString(style, "heygenVoiceId") || env.voiceId;

    if (!env.apiKey || !avatarId || !voiceId) {
      return {
        mode: "placeholder",
        videoUrl: staticUrl,
        externalProvider: null,
        externalJobId: null,
        message:
          "HeyGen: set HEYGEN_API_KEY, HEYGEN_AVATAR_ID, HEYGEN_VOICE_ID (clone or stock voice in HeyGen). Optional styleConfig: heygenAvatarId, heygenVoiceId.",
      };
    }

    const started = await heygenCreateAvatarVideo({
      apiKey: env.apiKey,
      avatarId,
      voiceId,
      scriptText,
      title: "LECIPM AI guide",
      callbackId: cfgString(style, "heygenCallbackId"),
    });

    if (!started.ok) {
      return {
        mode: "placeholder",
        videoUrl: staticUrl,
        externalProvider: null,
        externalJobId: null,
        message: started.error,
      };
    }

    if (sync) {
      const final = await heygenPollUntilDone(env.apiKey, started.videoId, { maxMs });
      return {
        mode: final.videoUrl ? "static_cdn" : "heygen_async",
        videoUrl: final.videoUrl ?? staticUrl,
        externalProvider: "heygen",
        externalJobId: started.videoId,
        message: final.status === "failed" ? "HeyGen render failed" : undefined,
      };
    }

    return {
      mode: "heygen_async",
      videoUrl: staticUrl,
      externalProvider: "heygen",
      externalJobId: started.videoId,
      message: "Poll heygenGetVideoStatus or use HeyGen webhooks; URLs expire — cache or re-fetch.",
    };
  }

  // D-ID
  const env = getDidConfig();
  const sourceImageUrl = cfgString(style, "didSourceImageUrl") ?? env.sourceImageUrl;

  if (!env.apiKey || !sourceImageUrl) {
    return {
      mode: "placeholder",
      videoUrl: staticUrl,
      externalProvider: null,
      externalJobId: null,
      message: "D-ID: set DID_API_KEY and DID_SOURCE_IMAGE_URL (HTTPS face image). Optional styleConfig.didSourceImageUrl.",
    };
  }

  const created = await didCreateTalk({
    apiKey: env.apiKey,
    sourceImageUrl,
    scriptText,
    ttsProviderType: env.scriptProviderType,
    ttsVoiceId: env.scriptVoiceId,
  });

  if (!created.ok) {
    return {
      mode: "placeholder",
      videoUrl: staticUrl,
      externalProvider: null,
      externalJobId: null,
      message: created.error,
    };
  }

  if (sync) {
    const final = await didPollUntilDone(env.apiKey, created.talkId, { maxMs });
    return {
      mode: final.resultUrl ? "static_cdn" : "did_async",
      videoUrl: final.resultUrl ?? staticUrl,
      externalProvider: "d-id",
      externalJobId: created.talkId,
      message: final.status === "error" || final.status === "rejected" ? "D-ID render failed" : undefined,
    };
  }

  return {
    mode: "did_async",
    videoUrl: staticUrl,
    externalProvider: "d-id",
    externalJobId: created.talkId,
    message: "Poll didGetTalk until status done; use result_url for MP4.",
  };
}
