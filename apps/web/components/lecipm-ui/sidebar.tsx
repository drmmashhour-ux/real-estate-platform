import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

/** Prefix for LECIPM broker-console routes (localized via `Link`): `/dashboard/lecipm`. */
export const LECIPM_CONSOLE_BASE = "/dashboard/lecipm";

export type SidebarNavItem = {
  label: string;
  href?: string;
  embellish?: ReactNode;
};

const DEFAULT_NAV: SidebarNavItem[] = [
  { label: "Dashboard", href: `${LECIPM_CONSOLE_BASE}` },
  { label: "Listings", href: `${LECIPM_CONSOLE_BASE}/listings` },
  { label: "Listing Assistant", href: `${LECIPM_CONSOLE_BASE}/listings/assistant`, embellish: "✨" },
  { label: "Closing", href: "/dashboard/closing" },
  { label: "Portfolio", href: "/dashboard/portfolio" },
  { label: "Executive", href: "/dashboard/executive" },
  { label: "Deals", href: `${LECIPM_CONSOLE_BASE}/deals` },
  { label: "Leads", href: `${LECIPM_CONSOLE_BASE}/leads` },
  { label: "Compliance", href: `${LECIPM_CONSOLE_BASE}/compliance`, embellish: "🛡️" },
  { label: "Investment", href: `${LECIPM_CONSOLE_BASE}/investment` },
  { label: "Settings", href: `${LECIPM_CONSOLE_BASE}/settings` },
];

type SidebarProps = {
  items?: SidebarNavItem[];
  header?: ReactNode;
};

export function Sidebar({ items = DEFAULT_NAV, header }: SidebarProps) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[#222222] bg-black">
      {header ? <div className="border-b border-[#222222] p-4">{header}</div> : null}
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Workspace">
        <ul className="space-y-1 text-sm text-neutral-300">
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-white/5 hover:text-white"
                >
                  <span>{item.label}</span>
                  {item.embellish ? <span className="text-xs opacity-80">{item.embellish}</span> : null}
                </Link>
              ) : (
                <div className="flex items-center justify-between rounded-lg px-2 py-2">
                  <span>{item.label}</span>
                  {item.embellish ? <span className="text-xs opacity-80">{item.embellish}</span> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
