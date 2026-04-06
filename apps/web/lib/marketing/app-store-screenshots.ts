/** LECIPM App Store / Play marketing screenshot set — paths under `/public/marketing/screenshots/`. */

export type ScreenshotPlatform = "iphone" | "android";

export type AppStoreSlideSlug = "hero" | "search" | "trust" | "speed" | "ai";

export type AppStoreSlide = {
  slug: AppStoreSlideSlug;
  order: number;
  /** Public URL path */
  imagePng: string;
  imageWebp: string;
  title: string;
  subtitle: string;
};

export const APP_STORE_SLIDES: AppStoreSlide[] = [
  {
    slug: "hero",
    order: 1,
    imagePng: "/marketing/screenshots/screen-1-hero.png",
    imageWebp: "/marketing/screenshots/screen-1-hero.webp",
    title: "Find the right property faster",
    subtitle: "AI-powered search for smarter decisions",
  },
  {
    slug: "search",
    order: 2,
    imagePng: "/marketing/screenshots/screen-2-search.png",
    imageWebp: "/marketing/screenshots/screen-2-search.webp",
    title: "Advanced property search",
    subtitle: "Filters, map, and smart results",
  },
  {
    slug: "trust",
    order: 3,
    imagePng: "/marketing/screenshots/screen-3-trust.png",
    imageWebp: "/marketing/screenshots/screen-3-trust.webp",
    title: "Verified listings only",
    subtitle: "Direct contact with owners & brokers",
  },
  {
    slug: "speed",
    order: 4,
    imagePng: "/marketing/screenshots/screen-4-speed.png",
    imageWebp: "/marketing/screenshots/screen-4-speed.webp",
    title: "Contact in seconds",
    subtitle: "No friction. No hidden fees",
  },
  {
    slug: "ai",
    order: 5,
    imagePng: "/marketing/screenshots/screen-5-ai.png",
    imageWebp: "/marketing/screenshots/screen-5-ai.webp",
    title: "AI-powered insights",
    subtitle: "Make confident real estate decisions",
  },
];

export const EXPORT_DIMENSIONS: Record<ScreenshotPlatform, { width: number; height: number }> = {
  iphone: { width: 1290, height: 2796 },
  android: { width: 1080, height: 1920 },
};

export function getSlideBySlug(slug: string): AppStoreSlide | undefined {
  return APP_STORE_SLIDES.find((s) => s.slug === slug);
}
