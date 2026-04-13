import {
  ContentMachinePieceStatus,
  ContentMachineStyle,
  ListingStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  generateTikTokScripts,
  toTikTokListingInput,
  formatTikTokScriptSections,
  type TikTokScriptStyle,
} from "@/lib/bnhub/tiktok-scripts";
import type { ContentOptimizationSignals } from "@/lib/content-machine/optimization";
import { collectListingImageUrls } from "@/lib/bnhub/content-pipeline/collect-images";
import { isOpenAiConfigured } from "@/lib/ai/openai";

const DEFAULT_PROMPTS: Record<ContentMachineStyle, string> = {
  [ContentMachineStyle.price_shock]:
    "Beat order: HOOK (2s tease) → VISUAL (cuts) → VALUE (price + title/city) → CTA link in bio.",
  [ContentMachineStyle.lifestyle]:
    "HOOK mood → VISUAL day-in-life b-roll → VALUE rate on screen → CTA BNHUB.",
  [ContentMachineStyle.comparison]:
    "HOOK guess → VISUAL split-screen → VALUE honest price reveal → CTA.",
  [ContentMachineStyle.question]:
    "HOOK poll → VISUAL reveal → VALUE price → CTA.",
  [ContentMachineStyle.hidden_gem]:
    "HOOK curiosity → VISUAL neighborhood + stay → VALUE price + place name → CTA.",
};

async function ensureDefaultTemplates(): Promise<void> {
  for (const style of Object.values(ContentMachineStyle)) {
    const prompt = DEFAULT_PROMPTS[style];
    await prisma.contentTemplate.upsert({
      where: { style },
      create: { style, promptTemplate: prompt },
      update: {},
    });
  }
}

const STYLE_MAP: Record<TikTokScriptStyle, ContentMachineStyle> = {
  price_shock: ContentMachineStyle.price_shock,
  lifestyle: ContentMachineStyle.lifestyle,
  comparison: ContentMachineStyle.comparison,
  question: ContentMachineStyle.question,
  hidden_gem: ContentMachineStyle.hidden_gem,
};

function optimizationSignalsToHints(signals: ContentOptimizationSignals): {
  prioritizedStyles: TikTokScriptStyle[];
  hookExamples: string[];
} {
  const prioritizedStyles = signals.stylesRanked.map(
    (s) => s.style as unknown as TikTokScriptStyle
  );
  return {
    prioritizedStyles,
    hookExamples: signals.hookExamples,
  };
}

/**
 * Generate 5 style variants for a BNHUB listing and persist `MachineGeneratedContent` rows.
 */
export async function generateContent(
  listingId: string,
  opts?: { force?: boolean; optimizationSignals?: ContentOptimizationSignals | null }
): Promise<{ ids: string[] } | { skipped: true; reason: string }> {
  await ensureDefaultTemplates();

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      listingPhotos: { select: { url: true, isCover: true, sortOrder: true } },
    },
  });

  if (!listing) return { skipped: true, reason: "listing_not_found" };

  if (!opts?.force && listing.listingStatus !== ListingStatus.PUBLISHED) {
    return { skipped: true, reason: "not_published" };
  }

  const images = collectListingImageUrls(listing, listing.listingPhotos);
  const base = toTikTokListingInput({
    title: listing.title,
    city: listing.city,
    nightPriceCents: listing.nightPriceCents,
    photos: listing.photos,
  });
  const input = {
    ...base,
    images: images.length ? images : base.images,
  };

  const hints = opts?.optimizationSignals
    ? optimizationSignalsToHints(opts.optimizationSignals)
    : undefined;
  const pack = await generateTikTokScripts(input, hints);
  const source = isOpenAiConfigured() ? "openai" : "deterministic";

  const rows: string[] = [];
  for (let i = 0; i < pack.scripts.length; i++) {
    const block = pack.scripts[i]!;
    const caption = pack.captions[i] ?? block.hook;
    const hashtags = pack.hashtags;
    const style = STYLE_MAP[block.style] ?? ContentMachineStyle.price_shock;
    const script = formatTikTokScriptSections(block);

    const row = await prisma.machineGeneratedContent.create({
      data: {
        listingId,
        style,
        hook: block.hook.slice(0, 512),
        script,
        caption,
        hashtagsJson: hashtags as Prisma.InputJsonValue,
        status: ContentMachinePieceStatus.generated,
        source,
        metadataJson: {
          visualOrder: images.length ? "hero_first" : "unknown",
          imageCount: images.length,
        } as Prisma.InputJsonValue,
      },
    });
    rows.push(row.id);
  }

  return { ids: rows };
}
