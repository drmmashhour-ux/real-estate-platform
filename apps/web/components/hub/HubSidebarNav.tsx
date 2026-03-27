"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HubTheme } from "@/lib/hub/themes";
import type { NavItem } from "@/lib/hub/navigation";

function NavGlyph({ href }: { href: string }) {
  const p = href.split("?")[0] ?? "";
  if (p === "/admin" || p.endsWith("/dashboard") || p.endsWith("/bnhub")) {
    return (
      <svg className="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  }
  if (p.includes("listing") || p.includes("moderation")) {
    return (
      <svg className="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  if (p.includes("user")) {
    return (
      <svg className="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (p.includes("finance") || p.includes("transaction") || p.includes("payment") || p.includes("revenue") || p.includes("commission") || p.includes("income")) {
    return (
      <svg className="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (p.includes("dispute") || p.includes("issue") || p.includes("trust") || p.includes("fraud")) {
    return (
      <svg className="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

type Props = {
  items: NavItem[];
  theme: HubTheme;
  isDark: boolean;
};

export function HubSidebarNav({ items, theme, isDark }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 px-3 lg:flex-col lg:gap-0.5" aria-label="Hub">
      {items.map((item, index) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const accent = theme.accent;
        return (
          <Link
            key={`${item.href}-${item.label}-${index}`}
            href={item.href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:opacity-95"
            style={{
              color: isDark ? "rgba(255,255,255,0.92)" : theme.text ?? "#111",
              backgroundColor: active
                ? isDark
                  ? "rgba(255,255,255,0.08)"
                  : `${accent}14`
                : "transparent",
              borderLeft: active ? `3px solid ${accent}` : "3px solid transparent",
              boxShadow: active ? `inset 0 0 0 1px ${isDark ? "rgba(255,255,255,0.06)" : `${accent}25`}` : undefined,
            }}
          >
            <span style={{ color: active ? accent : isDark ? "rgba(255,255,255,0.55)" : theme.textMuted }}>
              <NavGlyph href={item.href} />
            </span>
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
