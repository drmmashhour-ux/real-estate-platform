"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
];

export default function MobileListingDetailDemoPage() {
  const params = useParams<{ locale: string; country: string; id: string }>();
  const [idx, setIdx] = useState(0);
  const root = `/${params.locale}/${params.country}`;

  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black pb-28">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[idx]} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={next}
          className="absolute inset-y-0 right-0 w-1/3"
          aria-label="Next image"
        />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-[#D4AF37]" : "bg-white/30"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 pt-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#D4AF37]/80">Listing {params.id}</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Golden Mile residence</h1>
          <p className="mt-2 text-lg text-[#D4AF37]">$2,150,000</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/70">
          <span className="text-[#D4AF37]">AI insight:</span> Demand for this micro-market is +9% vs 30-day baseline; tour conversion is strong among returning visitors.
        </div>

        <p className="text-sm leading-relaxed text-white/55">
          Swipe the photo area to browse media. Sticky actions stay visible while you scroll details.
        </p>

        <Link href={`${root}/m/search`} className="inline-block text-sm text-[#D4AF37]">
          ← Back to search
        </Link>
      </div>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-lg gap-3">
          <button
            type="button"
            className="flex-1 rounded-full border border-[#D4AF37]/40 py-3 text-sm font-medium text-[#D4AF37]"
          >
            Contact
          </button>
          <button type="button" className="flex-1 rounded-full bg-[#D4AF37] py-3 text-sm font-medium text-black">
            Book / offer
          </button>
        </div>
      </div>
    </div>
  );
}
