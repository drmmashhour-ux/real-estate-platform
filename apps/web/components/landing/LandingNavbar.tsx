"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { QuebecFlagIcon } from "@/components/brand/QuebecFlagIcon";
import { HEADER_CONTROL } from "@/components/layout/header-action-classes";

const navCta =
  "lecipm-touch hidden h-10 min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C9A96A]/50 bg-[#C9A96A] px-4 text-sm font-semibold leading-none text-black transition-all duration-300 hover:bg-[#E5C07B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96A]/50 sm:inline-flex";

type Props = { basePath: string };

export function LandingNavbar({ basePath }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-neutral-800/80 bg-black/50 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto grid h-[72px] w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-x-2 px-4 sm:gap-x-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex shrink-0" aria-hidden>
            <QuebecFlagIcon className="h-5 w-7 rounded-sm sm:h-6 sm:w-[1.62rem]" />
          </span>
          <span className="hidden max-w-[9rem] truncate rounded-full border border-neutral-700 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-300 sm:max-w-none md:inline">
            Québec Platform
          </span>
        </div>

        <div className="flex min-w-0 justify-center px-1">
          <div className="mx-auto min-w-0">
            <LecipmBrandLockup href={basePath} variant="dark" align="center" density="compact" priority />
          </div>
        </div>

        <nav className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-3" aria-label="Account">
          <Link href="/auth/login" className={`${HEADER_CONTROL} hidden text-sm sm:inline-flex`}>
            Login
          </Link>
          <Link href="/auth/signup" className={navCta}>
            Sign up
          </Link>
          <button
            type="button"
            className={`${HEADER_CONTROL} shrink-0 lg:hidden`}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </nav>
      </div>

      {open ? (
        <div className="border-t border-neutral-800 bg-black/95 px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            <Link
              href="/auth/login"
              className="min-h-[48px] rounded-xl px-3 py-3 text-base font-semibold hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="min-h-[48px] rounded-xl bg-[#C9A96A] px-3 py-3 text-center text-base font-bold text-black shadow-[0_8px_24px_rgba(201,169,106,0.25)] transition duration-300 hover:bg-[#E5C07B]"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
            <Link
              href={`${basePath}/listings`}
              className="min-h-[48px] rounded-xl px-3 py-3 text-neutral-300 hover:bg-white/[0.04]"
              onClick={() => setOpen(false)}
            >
              Browse listings
            </Link>
            <Link
              href={`${basePath}/analyze`}
              className="min-h-[48px] rounded-xl px-3 py-3 text-neutral-300 hover:bg-white/[0.04]"
              onClick={() => setOpen(false)}
            >
              Analyze
            </Link>
          </div>
          </div>
      ) : null}
    </header>
  );
}

export default LandingNavbar;
