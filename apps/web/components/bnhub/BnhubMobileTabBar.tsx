"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, MessageCircle, Plane, User } from "lucide-react";

const TABS = [
  {
    href: "/bnhub",
    label: "Home",
    icon: Home,
    test: (p: string) => /\/bnhub$/.test(p) && !p.includes("/bnhub/"),
  },
  { href: "/bnhub/map", label: "Map", icon: Map, test: (p: string) => p.includes("/bnhub/map") },
  { href: "/bnhub/trips", label: "Trips", icon: Plane, test: (p: string) => p.includes("/bnhub/trips") },
  {
    href: "/dashboard/bnhub/messages",
    label: "Messages",
    icon: MessageCircle,
    test: (p: string) => p.includes("/bnhub/messages") || p.includes("/dashboard/bnhub/messages"),
  },
  { href: "/bnhub/profile", label: "Profile", icon: User, test: (p: string) => p.includes("/bnhub/profile") },
] as const;

export function BnhubMobileTabBar() {
  const pathname = usePathname() ?? "";
  const path = pathname.split("?")[0] ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-bnhub-border bg-bnhub-main/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      aria-label="BNHUB primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-2">
        {TABS.map(({ href, label, icon: Icon, test }) => {
          const active = test(path);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 px-1 py-1 text-[10px] font-semibold tracking-wide transition-all duration-200 active:scale-90 active:opacity-70 ${
                  active ? "text-bnhub-gold" : "text-bnhub-text-muted hover:text-bnhub-text-secondary"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-bnhub-gold" : ""}`} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
