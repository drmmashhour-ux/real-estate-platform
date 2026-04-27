export type ConversionIntentLevel = "low" | "medium" | "high";

export type ConversionScore = {
  listingId: string;
  userId?: string;
  score: number;
  intentLevel: ConversionIntentLevel;
  reasons: string[];
  /**
   * When true, "high" copy may reference attention/demand. If false, high scores still reflect intent
   * but nudge text stays in the medium tier (safety: no ungrounded urgency).
   */
  canUseHighAttentionCopy: boolean;
};

export type ConversionNudge = {
  title: string;
  message: string;
  intentLevel: ConversionIntentLevel;
  /** Shown level (may be medium when raw intent is high if attention copy is not supported). */
  displayLevel: ConversionIntentLevel;
};
