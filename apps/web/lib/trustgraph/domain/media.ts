export type MediaSceneCategory =
  | "exterior"
  | "interior"
  | "street"
  | "document"
  | "id"
  | "unknown";

export type MediaClassificationResult = {
  category: MediaSceneCategory;
  confidence: number;
  engineVersion: string;
  source: "stub_heuristic" | "model";
};
