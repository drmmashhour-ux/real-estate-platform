"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { appPathnameFromUrl } from "@/i18n/pathname";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

function navLinkCls(active: boolean) {
  return [
    "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    active ? "bg-ds-gold/12 text-ds-gold" : "text-ds-text-secondary hover:bg-white/5 hover:text-ds-text",
  ].join(" ");
}

/**
 * Vertical hub navigation — pairs with `DashboardLayout` sidebar slot or standalone column.
 */
export function Sidebar({ items, ariaLabel = "Hub navigation" }: { items: SidebarNavItem[]; ariaLabel?: string }) {
  const pathname = usePathname();
  const appPath = appPathnameFromUrl(pathname ?? "/");

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = appPath === item.href || appPath.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={navLinkCls(active)} aria-current={active ? "page" : undefined}>
            {item.icon ? <span className="shrink-0 opacity-90">{item.icon}</span> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
