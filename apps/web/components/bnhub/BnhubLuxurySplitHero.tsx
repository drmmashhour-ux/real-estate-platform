import Image from "next/image";
import { BNHUB_REASSURANCE_LINE } from "@/components/bnhub/BnHubHeaderMark";
import { BnhubHeroVacationVideo } from "@/components/bnhub/BnhubHeroVacationVideo";
import { BnhubStripeTrustHint } from "@/components/bnhub/BnhubStripeTrustHint";

/** Guest mood: bright coastal / beach-adjacent suite */
const HERO_GUEST =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=85";
/** Host mood: premium villa façade */
const HERO_HOST =
  "https://images.unsplash.com/photo-1613490493576-495fefd28f73?auto=format&fit=crop&w=2000&q=85";

/**
 * Split photography hero for BNHUB — guest discovery + host property story.
 */
export function BnhubLuxurySplitHero() {
  return (
    <section className="relative min-h-[min(72vh,720px)]">
      <div className="absolute inset-0 grid md:grid-cols-2">
        <div className="relative min-h-[220px] md:min-h-0">
          <Image
            src={HERO_GUEST}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/65 md:bg-gradient-to-r md:from-black/80 md:via-black/55 md:to-black/40" />
          <p className="absolute bottom-4 left-4 z-[1] max-w-[12rem] text-[10px] font-medium uppercase tracking-wider text-white/70">
            Guest stays — beach &amp; resort mood
          </p>
        </div>
        <div className="relative min-h-[220px] md:min-h-0">
          <Image
            src={HERO_HOST}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/65 md:bg-gradient-to-l md:from-black/80 md:via-black/55 md:to-black/40" />
          <p className="absolute bottom-4 right-4 z-[1] max-w-[12rem] text-right text-[10px] font-medium uppercase tracking-wider text-white/70">
            Short-term — villa &amp; premium homes
          </p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-2 lg:gap-4 lg:px-8 lg:pb-12 lg:pt-12">
        <div className="text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-premium-gold">BNHUB · Short-term stays</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-premium-gold sm:text-5xl lg:max-w-none lg:text-[2.75rem] lg:leading-tight">
            Where to next?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-premium-gold/85 sm:text-lg lg:max-w-none">
            Search verified stays across Québec — from city weekends to coastal escapes. Every listing shows a{" "}
            <strong className="text-premium-gold">listing code</strong> so you always know exactly which place you are
            viewing.
          </p>
          <p className="mt-4 text-[13px] font-normal leading-relaxed text-premium-gold/55 sm:text-sm sm:text-premium-gold/60">
            {BNHUB_REASSURANCE_LINE}
          </p>
          <BnhubStripeTrustHint className="mx-auto mt-5 max-w-2xl lg:mx-0" variant="prominent" tone="dark" />
        </div>
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
          <BnhubHeroVacationVideo
            youtubeId={process.env.NEXT_PUBLIC_BNHUB_HERO_YOUTUBE_ID}
            videoUrl={process.env.NEXT_PUBLIC_BNHUB_HERO_VIDEO_URL}
          />
        </div>
      </div>
    </section>
  );
}
