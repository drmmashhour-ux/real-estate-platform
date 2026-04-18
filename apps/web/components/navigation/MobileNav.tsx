"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { appPathnameFromUrl } from "@/i18n/pathname";
import type { SidebarNavItem } from "./Sidebar";

type Props = {
  items: SidebarNavItem[];
  /** Trigger button (e.g. hamburger) — receives open toggle */
  trigger: (open: boolean, onClick: () => void) => ReactNode;
  title?: string;
};

/**
 * Full-screen overlay nav for small viewports — same items as `Sidebar`.
 */
export function MobileNav({ items, trigger, title = "Menu" }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const appPath = appPathnameFromUrl(pathname ?? "/");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      {trigger(open, () => setOpen((o) => !o))}
      {open ? (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/70 backdrop-blur-sm" role="dialog" aria-modal aria-label={title}>
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-[min(100%,20rem)] flex-col border-l border-ds-border bg-ds-bg shadow-ds-soft">
            <div className="flex items-center justify-between border-b border-ds-border px-4 py-3">
              <p className="text-sm font-semibold text-ds-text">{title}</p>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-ds-text-secondary hover:bg-white/5 hover:text-ds-text"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Mobile hub navigation">
              {items.map((item) => {
                const active = appPath === item.href || appPath.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-base font-medium",
                      active ? "bg-ds-gold/12 text-ds-gold" : "text-ds-text hover:bg-white/5",
                    ].join(" ")}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
