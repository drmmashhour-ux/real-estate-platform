import Image from "next/image";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand";
import { getPlatformAppUrl } from "@/lib/platform-url";

export function LandingHero() {
  const platformUrl = getPlatformAppUrl();

  return (
    <section className="relative min-h-[min(92vh,900px)] w-full overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2400&auto=format&fit=crop"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-[min(92vh,900px)] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-white">{PLATFORM_NAME}</p>
        <p className="mt-2 font-serif text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          {PLATFORM_CARREFOUR_NAME}
        </p>
        <h1 className="mt-6 max-w-4xl font-serif text-4xl font-normal leading-tight text-white sm:text-5xl md:text-[3.25rem]">
          Discover Prestige Real Estate Opportunities
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#CCCCCC]">
          Buy, sell, and invest with confidence using advanced tools and AI insights.
        </p>
        <p className="mt-2 text-sm text-[#CCCCCC]/70">Where Prestige Meets Opportunity</p>

        <div className="mt-12 flex w-full max-w-4xl flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5">
          <a
            href={platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-8 py-3.5 text-sm font-semibold text-[#0B0B0B] shadow-[0_8px_32px_rgba(212, 175, 55,0.25)] transition hover:bg-[#D4AF37]"
          >
            Access Platform
            <span className="ml-2 text-[10px] font-normal uppercase tracking-widest text-[#0B0B0B]/70">
              ↗ app
            </span>
          </a>
          <Link
            href="/properties"
            className="inline-flex items-center justify-center rounded-lg border border-[#D4AF37] px-8 py-3.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            Browse Properties
          </Link>
          <Link
            href="#investor-positioning"
            className="inline-flex items-center justify-center rounded-lg border border-[#D4AF37] px-8 py-3.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            Start Investing
          </Link>
        </div>
      </div>
    </section>
  );
}
