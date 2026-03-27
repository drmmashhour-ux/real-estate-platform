import sharp from "sharp";

/**
 * Non-binding heuristics only — does not approve identity; admins review manually.
 */
export type IdentityUploadAssist = {
  imageReadable: boolean;
  dimensionsOk: boolean;
  /** Rough portrait-style heuristic for selfie (not face detection). */
  faceLikely: boolean;
  notes: string;
};

export async function assessIdentityUploadAssist(
  buf: Buffer,
  kind: "id" | "selfie"
): Promise<IdentityUploadAssist> {
  try {
    const meta = await sharp(buf).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const dimensionsOk = w >= 200 && h >= 200;
    const ratio = w > 0 ? h / w : 0;
    const faceLikely =
      kind === "selfie" && dimensionsOk && ratio > 0.85 && ratio < 2.2 && Math.min(w, h) >= 240;
    const notes =
      kind === "id"
        ? "Document image decoded; manual review required."
        : faceLikely
          ? "Selfie dimensions suggest a portrait photo; manual review required."
          : "Selfie may be unclear or not portrait-oriented; manual review required.";
    return {
      imageReadable: true,
      dimensionsOk,
      faceLikely: kind === "selfie" ? faceLikely : false,
      notes,
    };
  } catch {
    return {
      imageReadable: false,
      dimensionsOk: false,
      faceLikely: false,
      notes: "Could not read image data.",
    };
  }
}
