export type GtmSegment = "host_bnhub" | "broker" | "seller" | "buyer" | "investor";

export type GtmChannel = "short_pitch" | "long_pitch" | "dm" | "email" | "call";

export type GtmScriptRequest = {
  segment: GtmSegment;
  channel: GtmChannel;
  /** Optional — city for localization (e.g. Montreal). */
  market?: string;
  /** Optional product hooks — no fabricated metrics. */
  bullets?: string[];
};
