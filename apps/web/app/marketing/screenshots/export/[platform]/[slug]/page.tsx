import { notFound } from "next/navigation";
import { AppStoreScreenshot } from "@/components/marketing/AppStoreScreenshot";
import { APP_STORE_SLIDES, EXPORT_DIMENSIONS, getSlideBySlug, type ScreenshotPlatform } from "@/lib/marketing/app-store-screenshots";

export function generateStaticParams() {
  const platforms: ScreenshotPlatform[] = ["iphone", "android"];
  return platforms.flatMap((platform) =>
    APP_STORE_SLIDES.map((s) => ({
      platform,
      slug: s.slug,
    }))
  );
}

type PageProps = { params: Promise<{ platform: string; slug: string }> };

export default async function ScreenshotExportPage({ params }: PageProps) {
  const { platform: platformRaw, slug: slugRaw } = await params;
  if (platformRaw !== "iphone" && platformRaw !== "android") notFound();

  const slide = getSlideBySlug(slugRaw);
  if (!slide) notFound();

  const platform = platformRaw as ScreenshotPlatform;
  const dim = EXPORT_DIMENSIONS[platform];

  return (
    <AppStoreScreenshot
      title={slide.title}
      subtitle={slide.subtitle}
      image={slide.imagePng}
      exportWidth={dim.width}
      exportHeight={dim.height}
      captureId="lecipm-store-export-root"
      variant="default"
    />
  );
}
