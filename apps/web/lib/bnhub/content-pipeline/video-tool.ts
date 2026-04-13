import type { TikTokScriptBlock, TikTokScriptsPayload } from "@/lib/bnhub/tiktok-scripts";
import { getVideoTool, type VideoToolName } from "@/lib/bnhub/content-pipeline/env";

export type VerticalVideoPayload = {
  style: "short_form_vertical";
  aspectRatio: "9:16";
  /** Target length for editors (Runway / Pictory) */
  durationHintSec: number;
  images: string[];
  script: Pick<TikTokScriptBlock, "style" | "hook" | "middle" | "value" | "cta">;
  listing: {
    title: string;
    city: string;
    pricePerNightLabel: string;
    listingCode: string | null;
  };
};

export type VideoToolDispatchResult = {
  tool: VideoToolName;
  videoUrl: string | null;
  externalRequestId: string | null;
  skippedReason?: string;
};

/**
 * Build the payload social video tools expect (images + script + vertical format).
 */
export function buildVerticalVideoPayload(
  listing: {
    title: string;
    city: string;
    listingCode: string | null;
    nightPriceCents: number;
    currency: string;
  },
  pack: TikTokScriptsPayload,
  primaryScript: TikTokScriptBlock,
  images: string[]
): VerticalVideoPayload {
  const price =
    listing.nightPriceCents <= 0
      ? "—"
      : new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: listing.currency || "CAD",
          maximumFractionDigits: listing.nightPriceCents % 100 === 0 ? 0 : 2,
        }).format(listing.nightPriceCents / 100);

  return {
    style: "short_form_vertical",
    aspectRatio: "9:16",
    durationHintSec: 20,
    images: images.slice(0, 8),
    script: {
      style: primaryScript.style,
      hook: primaryScript.hook,
      middle: primaryScript.middle,
      value: primaryScript.value,
      cta: primaryScript.cta,
    },
    listing: {
      title: listing.title,
      city: listing.city,
      pricePerNightLabel: price,
      listingCode: listing.listingCode,
    },
  };
}

/**
 * Dispatch to Runway / Pictory when API keys exist; otherwise return structured skip.
 * Wire real HTTP when `RUNWAY_API_KEY` / `PICTORY_API_KEY` (or product-specific) are set.
 */
export async function dispatchToVideoTool(payload: VerticalVideoPayload): Promise<VideoToolDispatchResult> {
  const tool = getVideoTool();
  if (tool === "none") {
    return {
      tool: "none",
      videoUrl: null,
      externalRequestId: null,
      skippedReason: "VIDEO_TOOL=none",
    };
  }

  if (tool === "runway") {
    const key = process.env.RUNWAY_API_KEY?.trim();
    if (!key) {
      return {
        tool: "runway",
        videoUrl: null,
        externalRequestId: null,
        skippedReason: "RUNWAY_API_KEY not set — store payload only",
      };
    }
    // Placeholder: real integration would POST to Runway Generative API
    void key;
    void payload;
    return {
      tool: "runway",
      videoUrl: null,
      externalRequestId: `runway_stub_${Date.now()}`,
      skippedReason: "Runway API not wired — request id reserved for future webhook",
    };
  }

  const pKey = process.env.PICTORY_API_KEY?.trim();
  if (!pKey) {
    return {
      tool: "pictory",
      videoUrl: null,
      externalRequestId: null,
      skippedReason: "PICTORY_API_KEY not set — store payload only",
    };
  }
  void pKey;
  void payload;
  return {
    tool: "pictory",
    videoUrl: null,
    externalRequestId: `pictory_stub_${Date.now()}`,
    skippedReason: "Pictory API not wired — request id reserved for future webhook",
  };
}
