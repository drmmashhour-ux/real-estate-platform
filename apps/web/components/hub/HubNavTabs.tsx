"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HUB_GOLD_CSS } from "./hub-tokens";

export type HubNavTabItem = { href: string; label: string };

type HubNavTabsProps = {
  items: HubNavTabItem[];
  className?: string;
};

export function HubNavTabs({ items, className = "" }: HubNavTabsProps) {
  const pathname = usePathname();
  return (
    <nav
      className={`flex flex-wrap gap-2 border-b border-white/10 pb-3 ${className}`}
      aria-label="Hub section"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-white/10" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
            style={active ? { color: HUB_GOLD_CSS, boxShadow: `inset 0 -2px 0 ${HUB_GOLD_CSS}` } : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
