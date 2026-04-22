"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SimpleModeToggle } from "./SimpleModeToggle";
import { VoiceSearchAssist } from "./SeniorLivingPageAssist";

export function SeniorLivingHomeEntry(props: { locale: string; country: string }) {
  const base = `/${props.locale}/${props.country}`;
  const router = useRouter();
  const [q, setQ] = useState("");

  function searchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const city = q.trim();
    if (city) router.push(`${base}/senior-living/results?city=${encodeURIComponent(city)}`);
    else router.push(`${base}/senior-living/results`);
  }

  return (
    <>
      <a
        href="#senior-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-teal-800 focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="border-b-2 border-neutral-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <SimpleModeToggle />

          <div id="senior-main">
            <h1 className="mt-6 text-center text-balance md:text-[2rem]">
              Find the right residence for you or your loved one
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-center sl-text-muted text-lg leading-relaxed">
              Clear choices. Verified residences. No pressure — take your time.
            </p>

            <form className="mx-auto mt-10 max-w-xl" onSubmit={searchSubmit} aria-label="Search by city">
              <label htmlFor="senior-city-search" className="sr-only">
                Enter city or postal code
              </label>
              <input
                id="senior-city-search"
                type="text"
                autoComplete="address-level2"
                placeholder="Enter city or postal code"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="sl-input mb-4 w-full"
              />
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <button type="submit" className="sl-btn-primary sl-btn-block-mobile w-full sm:w-auto sm:min-w-[200px]">
                  Search
                </button>
                <VoiceSearchAssist inputId="senior-city-search" />
              </div>
            </form>

            <nav
              className="mx-auto mt-12 flex max-w-3xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center"
              aria-label="Main choices"
            >
              <Link
                href={`${base}/senior-living/guide`}
                className="sl-btn-secondary sl-btn-block-mobile inline-flex min-h-[56px] items-center justify-center px-6 text-center no-underline"
              >
                I need help choosing
              </Link>
              <Link
                href={`${base}/senior-living/results`}
                className="sl-btn-secondary sl-btn-block-mobile inline-flex min-h-[56px] items-center justify-center px-6 text-center no-underline"
              >
                Browse residences
              </Link>
              <Link
                href={`${base}/senior-living/results?compare=1`}
                className="sl-btn-secondary sl-btn-block-mobile inline-flex min-h-[56px] items-center justify-center px-6 text-center no-underline"
              >
                Compare options
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="sl-text-muted text-lg">
          Need help reading this page? Use your phone or browser zoom — we designed large text so you should not need
          to.
        </p>
      </section>
    </>
  );
}
