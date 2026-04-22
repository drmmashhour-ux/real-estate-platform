/** LECIPM Video Content Engine — v1 template-based manifests */

export type VideoTemplateKey =
  | "listing_spotlight"
  | "luxury_property_showcase"
  | "bnhub_stay_spotlight"
  | "deal_of_the_day"
  | "top_5_listings_area"
  | "investor_opportunity_brief"
  | "residence_services_highlight";

export type VideoSceneType =
  | "hero_image"
  | "details_card"
  | "pricing_card"
  | "area_spotlight"
  | "cta_card";

export type VideoAspectRatio = "9:16" | "1:1" | "16:9";

export type VideoDurationTarget = 15 | 30 | 45;

export type VideoProjectStatus =
  | "draft"
  | "preview"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export type VideoSceneVm = {
  id: string;
  type: VideoSceneType;
  durationSec: number;
  overlayLines: string[];
  transitionIn: string;
  transitionOut: string;
};

export type VideoScriptVm = {
  templateKey: VideoTemplateKey;
  sourceKind: string;
  sourceId: string | null;
  title: string;
  hook: string;
  scenes: VideoSceneVm[];
  captions: string[];
  cta: string;
  hashtags: string[];
  suggestedCaption: string;
  targetPlatform: "tiktok" | "instagram_reels" | "youtube_shorts" | "linkedin";
  durationTargetSec: VideoDurationTarget;
  complianceNotes: string[];
  /** When true, assembly should prefer fewer scenes */
  mediaWarning?: string | null;
};

export type VideoRenderManifestVm = {
  version: 1;
  brand: {
    background: string;
    accent: string;
    titleFont: string;
    bodyFont: string;
  };
  aspectRatio: VideoAspectRatio;
  durationTargetSec: number;
  soundtrackRef: string | null;
  scenes: Array<{
    sceneId: string;
    type: VideoSceneType;
    durationSec: number;
    mediaUrl: string | null;
    overlayText: string[];
    transition: string;
  }>;
  ffmpegPlan?: Array<{
    step: number;
    inputImageIndex: number;
    durationSec: number;
    vf?: string;
  }>;
  ctaEndCard: {
    title: string;
    subtitle: string;
    durationSec: number;
  };
};

export type VideoMediaPackageVm = {
  rankedUrls: string[];
  coverFirst: boolean;
  warnings: string[];
};

export type VideoProjectRowVm = {
  id: string;
  templateKey: string;
  title: string;
  hookText: string;
  status: string;
  durationTargetSec: number;
  aspectRatio: string;
  targetPlatform: string;
  createdAt: string;
  scheduledAt: string | null;
  marketingHubPostId: string | null;
  impressionsApprox: number;
  clicksApprox: number;
};

export type VideoEngineDashboardVm = {
  drafts: VideoProjectRowVm[];
  previewQueue: VideoProjectRowVm[];
  scheduled: VideoProjectRowVm[];
  topPerforming: VideoProjectRowVm[];
  performanceSummary: {
    created: number;
    approved: number;
    published: number;
    impressionsApprox: number;
    clicksApprox: number;
  };
};
