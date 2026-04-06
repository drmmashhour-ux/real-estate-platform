"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { label: string; href: string };

function navItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  items: readonly AdminNavItem[];
  variant?: "sidebar" | "horizontal";
};

/**
 * Pathname-aware admin navigation (replaces index-based active styling).
 */
export function AdminSidebarNav({ items, variant = "sidebar" }: Props) {
  const pathname = usePathname() ?? "";

  if (variant === "horizontal") {
    return (
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden" aria-label="Quick links">
        {items.map((item) => {
          const active = navItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition ${
                active
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]"
                  : "border-white/10 bg-[#0b0b0b] text-white/80 hover:border-white/20"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="mt-8 space-y-2 text-sm" aria-label="Admin navigation">
      {items.map((item) => {
        const active = navItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-4 py-3 transition ${
              active
                ? "border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
