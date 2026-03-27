/**
 * LECIPM AI explainer — production video (HeyGen / D-ID) + voice (ElevenLabs).
 * Label all UI as AI; do not impersonate real people.
 */

export type { AvatarScriptContext, AvatarProfileLike, AvatarVideoGenerationResult } from "@/src/modules/ai-avatar/domain/avatar.types";
export { generateAvatarScript, type AvatarScriptBundle } from "@/src/modules/ai-avatar/application/generateAvatarScript";
export { generateAvatarVideo } from "@/src/modules/ai-avatar/application/generateAvatarVideo";
export { synthesizeExplainerVoice, type ExplainerVoiceResult } from "@/src/modules/ai-avatar/application/synthesizeExplainerVoice";

export {
  getLecipmAvatarVideoProvider,
  getHeyGenConfig,
  getDidConfig,
  getElevenLabsConfig,
  shouldSyncPollVideo,
  syncPollMaxMs,
} from "@/src/modules/ai-avatar/infrastructure/providers/productionAvatarEnv";

export {
  heygenCreateAvatarVideo,
  heygenGetVideoStatus,
  heygenPollUntilDone,
} from "@/src/modules/ai-avatar/infrastructure/providers/heygenVideoProvider";

export { didCreateTalk, didGetTalk, didPollUntilDone } from "@/src/modules/ai-avatar/infrastructure/providers/didVideoProvider";

export { elevenlabsTextToSpeech } from "@/src/modules/ai-avatar/infrastructure/providers/elevenlabsVoiceProvider";
