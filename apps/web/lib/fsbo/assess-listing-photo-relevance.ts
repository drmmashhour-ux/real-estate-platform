import sharp from "sharp";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import {
  buildCoverPhotoInstructions,
  buildPhotoContextInstructions,
} from "@/lib/fsbo/listing-property-consistency";
import { logError } from "@/lib/logger";

const VISION_MODEL = process.env.FSBO_LISTING_PHOTO_VISION_MODEL?.trim() || "gpt-4o-mini";

export type ListingPhotoAssessment = { ok: true } | { ok: false; userMessage: string };

export type AssessListingPhotoOptions = {
  /** From `FsboListing.propertyType` — used to reject mismatched imagery (e.g. house photo for a condo listing). */
  propertyType?: string | null;
  /**
   * `cover` = first gallery image: must be an exterior (or land-appropriate) shot with visible civic/building identifier
   * where required. `additional` = other positions — standard listing-photo rules only.
   */
  role?: "cover" | "additional";
};

/**
 * Reject clearly non-property images (e.g. food as main subject) for FSBO listing galleries.
 * When `propertyType` is set, also rejects photos that clearly mismatch the listing type (condo vs detached house, etc.).
 * Uses OpenAI vision when `OPENAI_API_KEY` is set and `FSBO_LISTING_PHOTO_AI_CHECK` is not `false`.
 * On model/API failure, allows upload (fail-open) so sellers are not blocked by outages.
 */
export async function assessListingPhotoForPropertyUse(
  buffer: Buffer,
  options?: AssessListingPhotoOptions
): Promise<ListingPhotoAssessment> {
  if (process.env.FSBO_LISTING_PHOTO_AI_CHECK === "false") {
    return { ok: true };
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    return { ok: false, userMessage: "Could not read this image. Try a different JPG, PNG, or WebP file." };
  }

  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w > 0 && h > 0 && Math.min(w, h) < 200) {
    return {
      ok: false,
      userMessage:
        "Image is too small. Use clear photos of the property (at least 200×200 pixels — real listing photos are usually much larger).",
    };
  }

  if (!isOpenAiConfigured() || !openai) {
    return { ok: true };
  }

  let jpegBuf: Buffer;
  try {
    jpegBuf = await sharp(buffer)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch (e) {
    logError("[assessListingPhotoForPropertyUse] sharp resize", e);
    return { ok: false, userMessage: "Could not process this image. Try another file." };
  }

  const dataUrl = `data:image/jpeg;base64,${jpegBuf.toString("base64")}`;
  const propertyType = options?.propertyType;
  const role = options?.role ?? "additional";
  const typeInstructions = buildPhotoContextInstructions(propertyType);
  const coverBlock = role === "cover" ? buildCoverPhotoInstructions(propertyType) : "";

  try {
    const completion = await openai.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: role === "cover" ? 360 : 300,
      temperature: 0.12,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You screen ONE image for a REAL ESTATE listing (residential, commercial, land, or rental).
${coverBlock}
GOAL: Accept only photos that help a buyer or tenant evaluate the ASSET — the building, land, or meaningful interior/exterior spaces tied to the listing.

ACCEPT when the image clearly shows property-related content, for example:
- House, townhouse, condo tower, plex, or commercial building exterior or facade
- Yards, gardens, lots, terrain, driveways, parking tied to the property
- Interior rooms (kitchen, bath, living room, bedroom, finished basement), hallways/lobbies of the subject building, balconies, amenities of the listed building
- Floor plans, construction progress of the listed structure, reasonable street/neighbourhood context that situates the property

REJECT when the PRIMARY subject does NOT support evaluating real estate, including:
- Large street-art / graffiti / mural as the main focus (incidental paint on a wall behind a yard is OK)
- Storage, warehouse, or moving scenes dominated by cardboard boxes or generic clutter with no clear dwelling or listed unit visible
- Food, meals, drinks, or restaurant plating as the main subject (incidental items in a kitchen photo are OK)
- Vehicles, boats, pets, or people as the sole subject with no property context
- Memes, ads, product shots, pure screenshots of text, unrelated infographics, or artwork unrelated to the building/land
- Random tourism/landmark photos with no identifiable property for sale or lease

When in doubt whether the image helps market THIS kind of listing, choose suitable:false.
${typeInstructions}

${
  role === "cover"
    ? "The cover photo MUST satisfy any COVER PHOTO block above. If this is the cover slot and it fails that block, choose suitable:false."
    : ""
}

Reply with ONLY valid JSON, no markdown fences:
{"suitable":true}
or
{"suitable":false,"reason":"under 120 characters, plain English"}`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const text = (completion.choices[0]?.message?.content ?? "").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const raw = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(raw) as { suitable?: boolean; reason?: string };

    if (parsed.suitable === true) return { ok: true };
    if (parsed.suitable === false) {
      return {
        ok: false,
        userMessage:
          (typeof parsed.reason === "string" && parsed.reason.trim()) ||
          (role === "cover"
            ? "Cover photo must be an exterior (or land) shot with a visible street/building number where applicable. Upload a clear street-facing photo of the property."
            : "This photo does not look like a property listing image. Upload pictures of the home, yard, or rooms."),
      };
    }
  } catch (e) {
    logError("[assessListingPhotoForPropertyUse] vision", e);
    return { ok: true };
  }

  return { ok: true };
}
