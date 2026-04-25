/**
 * Assistant voice capture — user gesture required; wraps shared Web Speech helper.
 */

export { isSpeechRecognitionSupported, startVoiceSearch } from "@/lib/search/voiceSearch";

export type VoiceCaptureHandlers = Parameters<typeof import("@/lib/search/voiceSearch").startVoiceSearch>[0];
