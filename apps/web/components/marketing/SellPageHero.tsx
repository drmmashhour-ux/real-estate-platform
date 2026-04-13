"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

/** Coastal resort — pool, architecture, sea; suitable hero for “sell” lifestyle. */
const SELL_HERO_IMAGE =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2400&q=85";

type SellPageHeroProps = {
  children: ReactNode;
};

export function SellPageHero({ children }: SellPageHeroProps) {
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section className="relative isolate min-h-[min(90vh,720px)] overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -left-[10%] -top-[10%] h-[120%] w-[120%] max-w-none ${motionOk ? "sell-hero-drift" : ""}`}
          >
            <Image
              src={SELL_HERO_IMAGE}
              alt=""
              fill
              priority
              className="object-cover object-[center_38%]"
              sizes="100vw"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/78 via-black/48 to-[#0B0B0B]/93" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_22%,rgba(0,0,0,0.12),rgba(0,0,0,0.72))]" />
        <div
          className="absolute inset-0 opacity-[0.14] mix-blend-soft-light"
          style={{
            backgroundImage:
              "linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.25) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: motionOk ? "sell-hero-shimmer 14s ease-in-out infinite" : "none",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[min(90vh,720px)] items-center px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/[0.12] bg-black/35 px-5 py-10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md sm:rounded-3xl sm:px-10 sm:py-12">
          {children}
        </div>
      </div>
    </section>
  );
}
