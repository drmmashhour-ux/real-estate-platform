"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function HubNav() {
  const t = useTranslations("Sybnb.nav");
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/sybnb" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-neutral-900">SYBNB</span>
          <span className="hidden rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-900 sm:inline">
            {t("badge")}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/sybnb/host" className="rounded-full px-3 py-1.5 text-neutral-700 transition hover:bg-neutral-100">
            {t("host")}
          </Link>
          <Link
            href="/dashboard/bookings"
            className="rounded-full px-3 py-1.5 text-neutral-700 transition hover:bg-neutral-100"
          >
            {t("bookings")}
          </Link>
          <Link href="/" className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-neutral-800 shadow-sm transition hover:border-amber-300/60">
            {t("hadiahHome")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Session-aware host link: server wrapper recommended; using static nav for now. */
export function SybnbHubHeader() {
  return <HubNav />;
}
