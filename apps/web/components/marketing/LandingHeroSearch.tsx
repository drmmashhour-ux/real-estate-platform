"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

function searchDestination(raw: string): string {
  const q = raw.trim();
  if (!q) return "/search";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)) {
    return `/listings/${encodeURIComponent(q)}`;
  }
  if (/^LST-[A-Z0-9]+$/i.test(q) || /^LEC-\d+$/i.test(q)) {
    return `/listings/${encodeURIComponent(q)}`;
  }
  return `/search?city=${encodeURIComponent(q)}`;
}

const badges = ["Verified listings", "AI-powered insights", "Secure transactions"] as const;

type Props = {
  className?: string;
};

export function LandingHeroSearch({ className = "" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = useCallback(() => {
    router.push(searchDestination(q));
  }, [q, router]);

  return (
    <div className={`w-full space-y-4 ${className}`.trim()}>
      <form
        className="w-full space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="landing-search" className="sr-only">
          Search by city, address, or listing ID
        </label>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
          <input
            id="landing-search"
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by city, address, or listing ID"
            className="min-h-[52px] w-full flex-1 rounded-2xl border-2 border-[#D4AF37]/35 bg-white px-4 py-3 text-base text-black shadow-md placeholder:text-neutral-500 focus:border-[#D4AF37] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 sm:min-h-14 sm:px-5 sm:text-lg"
            autoComplete="off"
          />
          <button
            type="submit"
            className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] px-6 py-3 text-base font-semibold text-black transition hover:brightness-110 sm:w-auto sm:min-w-[168px] sm:px-8"
          >
            Search properties
          </button>
        </div>
        <Link
          href="/list-your-property"
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-[#D4AF37] px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-[#D4AF37]/10"
        >
          List your property
        </Link>
      </form>

      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2" aria-label="Platform guarantees">
        {badges.map((label) => (
          <li key={label} className="flex min-h-[40px] items-center gap-2 text-sm text-white/85">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-xs font-bold text-[#D4AF37]">
              ✓
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
