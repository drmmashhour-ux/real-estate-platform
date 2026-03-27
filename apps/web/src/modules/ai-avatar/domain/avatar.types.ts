/** LECIPM explainer contexts (drives script templates elsewhere). */
export type AvatarScriptContext = "onboarding" | "simulator" | "negotiation" | "drafting" | "upgrade";

export type AvatarProfileLike = {
  videoBaseUrl: string;
  voiceProfileId: string | null;
  styleConfig: Record<string, unknown> | null;
};

/** Result of attempting to produce or schedule explainer media. */
export type AvatarVideoGenerationResult = {
  /** Pre-rendered / CDN loop — use immediately in `<video src>`. */
  videoUrl: string | null;
  /** heygen | d-id async job; poll with provider APIs or webhooks. */
  externalProvider: "heygen" | "d-id" | null;
  externalJobId: string | null;
  mode: "static_cdn" | "heygen_async" | "did_async" | "placeholder";
  message?: string;
};

export type HeyGenVideoStatus = {
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  raw: unknown;
};

export type DidTalkStatus = {
  status: string;
  resultUrl: string | null;
  raw: unknown;
};
