"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { key: string; href: (base: string) => string; label: string; icon: string }[] = [
  { key: "home", href: (b) => `${b}/m`, label: "Home", icon: "🏠" },
  { key: "search", href: (b) => `${b}/m/search`, label: "Search", icon: "🔍" },
  { key: "saved", href: (b) => `${b}/m/saved`, label: "Saved", icon: "❤️" },
  { key: "dashboard", href: (b) => `${b}/m/dashboard`, label: "Hubs", icon: "💼" },
  { key: "profile", href: (b) => `${b}/m/profile`, label: "Profile", icon: "👤" },
];

type Props = {
  locale: string;
  country: string;
};

export function LecipmMobileTabBar({ locale, country }: Props) {
  const pathname = usePathname();
  const base = `/${locale}/${country}`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2">
        {TABS.map((tab) => {
          const href = tab.href(base);
          const active = pathname === href || (tab.key === "home" && pathname === `${base}/m`);
          return (
            <Link
              key={tab.key}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-2 text-[10px] ${
                active ? "text-[#D4AF37]" : "text-white/45"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
