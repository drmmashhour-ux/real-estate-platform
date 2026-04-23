/**
 * Auto Video Generator — content model is renderer-agnostic (manifest v1 for FFmpeg / cloud later).
 */

export type AutoVideoSourceType =
  | "LISTING"
  | "BNHUB_STAY"
  | "INVESTOR_OP"
  | "BROKER_ACQ"
  | "RESIDENCE_SERVICE"
  | "MANUAL";

export type AutoVideoTargetPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE";

export type AutoVideoAspectRatio = "9:16" | "1:1" | "16:9";

export type AutoVideoAudience = "BROKER" | "BUYER" | "INVESTOR" | "HOST" | "GENERAL";

export type AutoVideoGoal = "LEADS" | "AWARENESS" | "CONVERSION";

export type AutoVideoJobStatus =
  | "DRAFT"
  | "GENERATED"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "RENDERING"
  | "RENDERED"
  | "FAILED"
  | "SCHEDULED"
  | "POSTED";

export type MediaAssetKind = "image" | "video" | "logo";

export type AutoVideoMediaAsset = {
  id: string;
  kind: MediaAssetKind;
  url: string;
  label?: string;
  /** 0–1 for timeline stacking */
  weight?: number;
};

export type AutoVideoSceneStyle = "CINEMATIC" | "FAST_CUT" | "MINIMAL" | "LUXURY_STATIC";

/**
 * One logical video the engine will build scenes + a manifest for.
 */
export type AutoVideoRequest = {
  id: string;
  sourceType: AutoVideoSourceType;
  sourceId: string;
  targetPlatform: AutoVideoTargetPlatform;
  targetAspectRatio: AutoVideoAspectRatio;
  audience: AutoVideoAudience;
  goal: AutoVideoGoal;
  title: string;
  hook: string;
  cta: string;
  mediaAssets: AutoVideoMediaAsset[];
  sceneStyle: AutoVideoSceneStyle;
  status: AutoVideoJobStatus;
  /** Picked or overridden template id */
  templateId: AutoVideoTemplateId;
  /** For analytics + CRM later */
  attribution: AutoVideoAttribution;
  createdAtIso: string;
  updatedAtIso: string;
  /** Editable copy before final render */
  customNotes?: string;
};

export type AutoVideoTemplateId =
  | "LISTING_SPOTLIGHT"
  | "LUXURY_SHOWCASE"
  | "BNHUB_WEEKEND_STAY"
  | "BROKER_RECRUITMENT"
  | "INVESTOR_OPPORTUNITY"
  | "RESIDENCE_SERVICES_OVERVIEW";

export type TextTiming = {
  startSec: number;
  endSec: number;
  trackIndex?: number;
};

export type AutoVideoScene = {
  id: string;
  kind: "HOOK" | "FEATURE" | "PRICING" | "LOCATION" | "CTA" | "BRAND";
  label: string;
  durationSec: number;
  backgroundMediaId?: string;
  overlayLines: { text: string; timing: TextTiming; role: "headline" | "sub" | "legal" }[];
  badge?: { text: string; position: "tl" | "tr" | "bl" | "br" };
  transition: "none" | "crossfade" | "slide_up" | "flash_gold";
  /** Suggested VO line for production */
  voiceoverHint?: string;
};

export type AutoVideoAttribution = {
  campaignId?: string;
  landingPagePath?: string;
  utmSource?: string;
  utmMedium?: string;
  /** Filled when posted / synced */
  views?: number;
  clicks?: number;
  leads?: number;
  revenueCents?: number;
};

export type LecipmBrandRules = {
  id: "lecipm-luxury-v1";
  baseHex: string;
  charcoalHex: string;
  goldHex: string;
  goldSoftHex: string;
  endCardCta: string;
  fontHeadline: string;
  fontBody: string;
  logoPlacement: "end_card" | "tr_watermark" | "both";
  safeAreaPct: { top: number; bottom: number; side: number };
};

export type AutoVideoRenderManifestV1 = {
  version: 1;
  requestId: string;
  targetPlatform: AutoVideoTargetPlatform;
  aspectRatio: AutoVideoAspectRatio;
  totalDurationSec: number;
  frameRate: number;
  scenes: {
    id: string;
    order: number;
    kind: AutoVideoScene["kind"];
    startSec: number;
    endSec: number;
    background?: { type: "image" | "video" | "solid"; ref?: string; solidHex?: string };
    textOverlays: {
      id: string;
      text: string;
      startSec: number;
      endSec: number;
      style: { sizePx: number; colorHex: string; align: "left" | "center" | "right" };
    }[];
    transitionToNext: AutoVideoScene["transition"];
    badge?: AutoVideoScene["badge"];
  }[];
  soundtrack: { assetId: string; volume: number; fadeInSec: number; fadeOutSec: number };
  branding: LecipmBrandRules;
  export: { format: "mp4" | "webm"; container: string; maxBitrateKbps: number; audioKbps: number };
  generatedAtIso: string;
};

export type ScenePreviewCard = {
  sceneId: string;
  kind: AutoVideoScene["kind"];
  title: string;
  summary: string;
  thumbDataUrl?: string;
};

export type AutoVideoJob = {
  id: string;
  request: AutoVideoRequest;
  /** Latest manifest after generation */
  manifest: AutoVideoRenderManifestV1 | null;
  /** Optional storyboard for UI */
  shotList: string;
  status: AutoVideoJobStatus;
  createdAtIso: string;
  updatedAtIso: string;
  approvedByUserId?: string;
  approvedAtIso?: string;
  rejectedReason?: string;
  renderOutputUrl?: string;
  failureReason?: string;
  /** Linked calendar content id if scheduled */
  calendarContentId?: string;
};
