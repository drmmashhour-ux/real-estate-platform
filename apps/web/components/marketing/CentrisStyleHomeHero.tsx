import Link from "next/link";
import { QuickPropertySearchForm } from "@/app/components/home/QuickPropertySearchForm";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop";

export function CentrisStyleHomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#D4AF37]/20 bg-[#020202]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.15),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
        {/* Logo + slogan — always centered */}
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src="/brand/lecipm-full-on-dark-2048.png"
            alt="LECIPM"
            width={2048}
            height={682}
            decoding="async"
            fetchPriority="high"
            className="
              w-[260px]
              max-w-full
              max-h-[160px]
              object-contain
              select-none
              pointer-events-none
              sm:w-[320px]
              sm:max-h-[200px]
              md:max-h-none
              md:w-[420px]
              lg:w-[520px]
              xl:w-[600px]
              [filter:drop-shadow(0_12px_40px_rgba(0,0,0,0.9))_drop-shadow(0_0_40px_rgba(212,175,55,0.25))]
            "
          />
          <p
            className="
              mt-3
              text-center
              text-[10px]
              font-light
              uppercase
              tracking-[0.3em]
              text-[#D4AF37]
              opacity-80
              sm:text-xs
            "
          >
            AI-DRIVEN REAL ESTATE MARKETPLACE
          </p>
        </div>

        {/* Headline + subline: centered mobile, left desktop */}
        <div className="text-center lg:text-left">
          <h1
            className="
              mt-6
              text-4xl
              font-semibold
              leading-tight
              tracking-tight
              text-white
              drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)]
              sm:mt-7
              sm:text-5xl
              lg:mt-8
              lg:mx-0
            "
          >
            Find the right property faster
          </h1>
          <p
            className="
              mt-3
              text-sm
              font-light
              tracking-wide
              text-white/70
              sm:text-base
              lg:mx-0
            "
          >
            With confidence, powered by AI
          </p>
        </div>

        {/* Search */}
        <div className="mt-6 w-full max-w-lg sm:mt-7 lg:mt-8 lg:max-w-xl">
          <div className="mx-auto rounded-2xl border border-[#D4AF37]/25 bg-black/75 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-5 lg:mx-0">
            <QuickPropertySearchForm variant="hero" />
          </div>
          <div className="mx-auto mt-4 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center lg:mx-0 lg:justify-start">
            <Link
              href="/host/listings/new"
              className="inline-flex min-h-[44px] w-full max-w-sm items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-5 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 active:scale-[0.98] sm:w-auto"
            >
              Start a listing
            </Link>
            <span className="text-center text-[11px] text-white/45 sm:hidden">Under 2 min · No commitment</span>
            <span className="hidden text-xs text-white/45 sm:inline sm:max-w-[16rem] sm:text-left">
              Under 2 minutes · No commitment · Guided steps
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
