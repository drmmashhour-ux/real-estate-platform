import type { Metadata } from "next";
import { AppStoreScreenshot } from "@/components/marketing/AppStoreScreenshot";
import { APP_STORE_SLIDES } from "@/lib/marketing/app-store-screenshots";

const title = "App Store screenshots — LECIPM";
const description = "Marketing preview: premium black & gold frames for store listings.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
};

export default function MarketingScreenshotsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/80">Marketing</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
        <p className="mt-4 text-xs text-zinc-500">
          Export PNGs: <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">pnpm screenshots:export</code> · WebP:{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">pnpm screenshots:optimize</code>
        </p>
      </div>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-16 pb-20">
        {APP_STORE_SLIDES.map((slide, i) => (
          <section key={slide.slug} className="scroll-mt-8">
            <p className="mb-4 text-center text-xs font-medium text-zinc-500">
              Screen {slide.order} · {slide.slug}
            </p>
            <AppStoreScreenshot
              title={slide.title}
              subtitle={slide.subtitle}
              image={slide.imageWebp}
              variant={i % 2 === 0 ? "default" : "gold-accent"}
            />
          </section>
        ))}
      </div>
    </main>
  );
}
