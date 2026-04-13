"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const POSTER =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=85";

type Props = {
  youtubeId?: string | null;
  videoUrl?: string | null;
};

function pickSrc(youtubeId?: string | null, videoUrl?: string | null) {
  const yt = (youtubeId ?? process.env.NEXT_PUBLIC_BNHUB_HERO_YOUTUBE_ID)?.trim();
  const mp4 = (videoUrl ?? process.env.NEXT_PUBLIC_BNHUB_HERO_VIDEO_URL)?.trim();
  return { yt: yt || undefined, mp4: mp4 || undefined };
}

/**
 * Click-to-play reel: loads on interaction so audio can play (user gesture).
 */
export function BnhubHeroVacationVideo({ youtubeId, videoUrl }: Props) {
  const { yt, mp4 } = pickSrc(youtubeId, videoUrl);
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startYoutube = useCallback(() => {
    setStarted(true);
  }, []);

  const startMp4 = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    const tryWithSound = async () => {
      el.muted = false;
      el.volume = 1;
      await el.play();
    };
    try {
      await tryWithSound();
    } catch {
      try {
        el.muted = true;
        await el.play();
        el.muted = false;
        el.volume = 1;
      } catch {
        return;
      }
    }
    setStarted(true);
  }, []);

  const frame =
    "pointer-events-auto w-full overflow-hidden rounded-2xl border border-premium-gold/25 bg-black/40 shadow-[0_24px_80px_rgb(0_0_0/0.55)] backdrop-blur-sm";

  if (yt) {
    return (
      <div className={frame}>
        <div className="relative aspect-video w-full bg-black">
          {started ? (
            <iframe
              title="BNHUB — travel and vacation stays"
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startYoutube();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="group absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/35 transition hover:bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Play video with sound"
            >
              <Image
                src={POSTER}
                alt=""
                fill
                draggable={false}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />
              <span className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-full border-2 border-premium-gold/90 bg-black/55 text-premium-gold shadow-lg backdrop-blur-sm transition group-hover:scale-105 group-active:scale-95 sm:h-20 sm:w-20">
                <Play className="ml-1 h-8 w-8 stroke-[2.25] sm:h-10 sm:w-10" aria-hidden />
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mp4) {
    return (
      <div className={frame}>
        <div className="relative aspect-video w-full bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 h-full w-full object-cover"
            playsInline
            preload="auto"
            poster={POSTER}
            controls={started}
            onPlay={() => setStarted(true)}
          >
            <source src={mp4} type="video/mp4" />
          </video>
          {!started ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void startMp4();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="group absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/35 transition hover:bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Play video with sound"
            >
              <span className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-full border-2 border-premium-gold/90 bg-black/55 text-premium-gold shadow-lg backdrop-blur-sm transition group-hover:scale-105 group-active:scale-95 sm:h-20 sm:w-20">
                <Play className="ml-1 h-8 w-8 stroke-[2.25] sm:h-10 sm:w-10" aria-hidden />
              </span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={frame}>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <Image src={POSTER} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
      </div>
    </div>
  );
}
