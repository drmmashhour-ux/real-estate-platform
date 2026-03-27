"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "lecipm_staging_demo_welcome_v1";

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)lecipm_guest_id=/.test(document.cookie);
}

/**
 * First-visit welcome on staging when logged in (complements product onboarding).
 */
export function DemoStagingWelcomeModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENV !== "staging") return;
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/embed") || pathname.startsWith("/auth")) {
      return;
    }
    try {
      if (!hasSessionCookie()) return;
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-welcome-title"
    >
      <div className="max-w-md rounded-2xl border border-[#C9A646]/30 bg-[#121212] p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">Demo environment</p>
        <h2 id="demo-welcome-title" className="mt-2 text-lg font-semibold text-white">
          Welcome — here&apos;s how to explore
        </h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-[#B3B3B3]">
          <li>Use the hub switcher and dashboard to try analysis and saved deals.</li>
          <li>Payments and emails may be simulated on staging — nothing here is production.</li>
          <li>Need a reset? Ask an admin to re-run the staging seed (see docs).</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl bg-[#C9A646] px-4 py-2.5 text-sm font-semibold text-[#0B0B0B]"
          >
            Got it
          </button>
          <Link href="/dashboard/real-estate" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/90">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
