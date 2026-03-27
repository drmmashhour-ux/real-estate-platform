import { growthJsonCompletion } from "@/src/modules/ai-growth-engine/infrastructure/growthLlm";

export type ThumbnailPack = {
  textOverlay: string;
  subtext: string;
  altText: string;
};

export async function generateThumbnailText(args: { topic: string }): Promise<ThumbnailPack> {
  const out = await growthJsonCompletion<ThumbnailPack>({
    system: "Return JSON { textOverlay, subtext, altText}. Max 5 words on overlay. Accessible alt text.",
    user: `Topic: ${args.topic}`,
  });
  if (!out.ok) {
    return {
      textOverlay: args.topic.slice(0, 24),
      subtext: "Educational",
      altText: `Thumbnail: ${args.topic}`,
    };
  }
  return out.data;
}
