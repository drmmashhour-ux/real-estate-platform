/**
 * Platform assistant feature flags (public env — safe defaults on).
 * Disable with NEXT_PUBLIC_PLATFORM_ASSISTANT_ENABLED=0
 */

export type AssistantFeatureFlags = {
  assistantEnabled: boolean;
  voiceInputEnabled: boolean;
  textToSpeechEnabled: boolean;
  voiceConversationEnabled: boolean;
  autoGreetEnabled: boolean;
  compareEnabled: boolean;
  bnhubHelpEnabled: boolean;
  propertyHelpEnabled: boolean;
};

function flag(name: string, defaultOn: boolean): boolean {
  const v = process.env[name];
  if (v === "0" || v === "false") return false;
  if (v === "1" || v === "true") return true;
  return defaultOn;
}

export function getAssistantConfig(): AssistantFeatureFlags {
  return {
    assistantEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_ENABLED", true),
    voiceInputEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_VOICE", true),
    textToSpeechEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_TTS", true),
    voiceConversationEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_VOICE_CONVERSATION", true),
    autoGreetEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_AUTO_GREET", true),
    compareEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_COMPARE", true),
    bnhubHelpEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_BNHUB_HELP", true),
    propertyHelpEnabled: flag("NEXT_PUBLIC_PLATFORM_ASSISTANT_PROPERTY_HELP", true),
  };
}
