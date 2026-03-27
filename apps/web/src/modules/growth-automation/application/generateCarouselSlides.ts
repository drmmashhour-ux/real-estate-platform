import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";

export type CarouselSlide = { index: number; headline: string; body: string; designHint: string };

export async function generateCarouselSlides(args: { topic: string; slideCount?: number }) {
  const n = Math.min(10, Math.max(3, args.slideCount ?? 5));
  const res = await growthAutomationJsonCompletion<{ slides: CarouselSlide[] }>({
    system: "Instagram/LinkedIn carousel JSON. Educational, concise.",
    user: `Topic: ${args.topic}. Slides: ${n}.`,
    label: "carousel",
  });
  if (!res.ok) {
    return {
      slides: Array.from({ length: n }, (_, i) => ({
        index: i + 1,
        headline: i === 0 ? args.topic : `Point ${i + 1}`,
        body: "Short supporting line.",
        designHint: "Dark background, gold accent",
      })),
    };
  }
  return res.data;
}
