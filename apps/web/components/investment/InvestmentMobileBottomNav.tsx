"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const icon = (d: string) => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AnalyzeIcon = () =>
  icon(
    "M4 19V5M4 19h16M8 17V9m4 8V7m4 10v-4"
  );

const DashboardIcon = () =>
  icon("M4 5h16v14H4V5zm4 4h8M8 13h4");

const CompareIcon = () =>
  icon("M8 7h12M8 12h8M8 17h5M4 7h.01M4 12h.01M4 17h.01");

/** Buying hub */
const BuyingIcon = () =>
  icon(
    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"
  );

/** Selling hub — tag / listing */
const SellingIcon = () =>
  icon("M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z");

const ProfileIcon = () =>
  icon(
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
  );

export function InvestmentMobileBottomNav() {
  const pathname = usePathname();
  const p = pathname ? pathname.replace(/\/$/, "") || "/" : "/";

  const [demo, setDemo] = useState(p.startsWith("/demo"));

  useEffect(() => {
    if (p.startsWith("/demo")) {
      setDemo(true);
      return;
    }
    const ac = new AbortController();
    fetch("/api/investment/nav-context", { credentials: "same-origin", signal: ac.signal })
      .then((r) => r.json() as Promise<{ demo?: boolean }>)
      .then((j) => setDemo(Boolean(j.demo)))
      .catch(() => setDemo(true));
    return () => ac.abort();
  }, [p]);

  const dashboardHref = demo ? "/demo/dashboard" : "/dashboard";
  const compareHref = demo ? "/demo/compare" : "/compare";
  /** Client help: contact form & inquiries — not the internal /support agent console */
  const supportHref = "/contact";

  const items = [
    {
      href: "/analyze",
      label: "Analyze",
      Icon: AnalyzeIcon,
      active: p === "/analyze" || p.startsWith("/analyze/"),
    },
    {
      href: dashboardHref,
      label: "Dashboard",
      Icon: DashboardIcon,
      active: p === dashboardHref || p.startsWith(`${dashboardHref}/`),
    },
    {
      href: compareHref,
      label: "Compare",
      Icon: CompareIcon,
      active: p === compareHref || p.startsWith(`${compareHref}/`),
    },
    {
      href: "/buying",
      label: "Buying",
      Icon: BuyingIcon,
      active: p === "/buying" || p.startsWith("/buying/"),
    },
    {
      href: supportHref,
      label: "Support",
      Icon: ProfileIcon,
      active: p === "/contact" || p.startsWith("/contact/") || p === "/help" || p.startsWith("/help/"),
    },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-[#0B0B0B]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around gap-0 overflow-x-auto px-0.5 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ href, label, Icon, active }) => (
          <li key={href} className="min-w-0 flex-1">
            <Link
              href={href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
                active
                  ? "text-[#C9A646]"
                  : "text-slate-400 active:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className={active ? "text-[#C9A646]" : "text-slate-500"}>
                <Icon />
              </span>
              <span className="truncate tracking-tight">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
