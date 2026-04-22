"use client";

import Link from "next/link";
import { useState } from "react";

const MODES = ["Buy", "Rent", "BNHub"] as const;

type Props = {
  /** e.g. `/en/ca` — listings and hub targets are prefixed */
  base: string;
};

export function LecipmHomeSearchPanel({ base }: Props) {
  const [modeIndex, setModeIndex] = useState(0);

  const searchHref =
    modeIndex === 0 ? `${base}/listings` : modeIndex === 1 ? `${base}/rent` : `${base}/bnhub/stays`;

  return (
    <div className="w-full max-w-4xl rounded-[30px] border border-[#D4AF37]/20 bg-black/45 p-4 shadow-[0_0_80px_rgba(212,175,55,0.14)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex-1 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4">
          <div className="mb-1 text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/80">Search</div>
          <input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Search by city, address, or listing ID"
            className="w-full bg-transparent text-base text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[320px] lg:grid-cols-3">
          {MODES.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setModeIndex(index)}
              className={`rounded-[20px] border px-4 py-4 text-sm transition ${
                index === modeIndex
                  ? "border-[#D4AF37]/70 bg-[#D4AF37] text-black"
                  : "border-white/10 bg-white/5 text-white hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
              }`}
            >
              {item}
            </button>
          ))}
          <Link
            href={searchHref}
            className="col-span-2 flex items-center justify-center rounded-[20px] border border-[#D4AF37]/50 bg-transparent px-4 py-4 text-center text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10 lg:col-span-1"
          >
            Search
          </Link>
        </div>
      </div>
    </div>
  );
}
