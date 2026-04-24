"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";
import type { PlatformRole } from "@prisma/client";

import { Link } from "@/i18n/navigation";

import { LECIPM_CONSOLE_BASE } from "@/components/lecipm-ui/sidebar";
import { LecipmConsoleBackToClassicButton } from "@/components/dashboard/LecipmConsoleSwitch";
import { engineFlags } from "@/config/feature-flags";

type NavItem = { label: string; href: string; executiveOnly?: boolean };

type NavGroup = { id: string; label: string; items: NavItem[] };

function buildGroups(role: PlatformRole): NavGroup[] {
  const executive = role === "ADMIN";
  const base: NavGroup[] = [
    {
      id: "command",
      label: "Command",
      items: [{ label: "Command Center", href: `${LECIPM_CONSOLE_BASE}` }],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { label: "Listings", href: `${LECIPM_CONSOLE_BASE}/listings` },
        { label: "Listing Assistant", href: `${LECIPM_CONSOLE_BASE}/listings/assistant` },
        { label: "Deals", href: `${LECIPM_CONSOLE_BASE}/deals` },
        { label: "Leads", href: `${LECIPM_CONSOLE_BASE}/leads` },
        { label: "Compliance", href: `${LECIPM_CONSOLE_BASE}/compliance` },
      ],
    },
    {
      id: "growth",
      label: "Growth & capital",
      items: [
        { label: "Investment", href: `${LECIPM_CONSOLE_BASE}/investment` },
        { label: "Portfolio (classic)", href: "/dashboard/portfolio" },
        { label: "Closing", href: "/dashboard/closing" },
      ],
    },
    {
      id: "intel",
      label: "Executive intel",
      items: [
        { label: "Executive overview", href: "/dashboard/executive", executiveOnly: true },
        { label: "Trust score", href: "/dashboard/admin/trust-score", executiveOnly: true },
        { label: "Dispute prediction", href: "/dashboard/admin/dispute-prediction", executiveOnly: true },
        { label: "Autonomy center", href: "/dashboard/admin/autonomy-command-center", executiveOnly: true },
        { label: "Territory war room", href: "/dashboard/admin/territory-war-room", executiveOnly: true },
        { label: "Self-expansion", href: "/dashboard/admin/self-expansion", executiveOnly: true },
        { label: "What-if simulation", href: `${LECIPM_CONSOLE_BASE}/simulation`, executiveOnly: true },
        { label: "Scenario autopilot", href: "/dashboard/admin/scenario-autopilot", executiveOnly: true },
      ],
    },
    {
      id: "system",
      label: "Workspace",
      items: [{ label: "Settings", href: `${LECIPM_CONSOLE_BASE}/settings` }],
    },
  ];

  return base
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.executiveOnly || executive),
    }))
    .filter((g) => g.items.length > 0);
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const tail = href.replace(/^\/+/, "");
  return pathname.endsWith(tail) || pathname.includes(`/${tail}`);
}

export function CommandCenterSidebar(props: { userRole: PlatformRole }) {
  const pathname = usePathname();
  const groups = buildGroups(props.userRole);

  return (
    <aside className="flex h-screen w-[17rem] shrink-0 flex-col border-r border-[#1a1a1a] bg-[#050505]">
      <div className="border-b border-[#1a1a1a] px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">LECIPM</p>
        <p className="mt-1 font-serif text-lg text-[#f4efe4]">Command Center</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <LecipmConsoleBackToClassicButton />
        </div>
        {engineFlags.lecipmConsoleDefault ?
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
            Prefer the classic portfolio? Use &quot;Back to Classic&quot; — your choice is remembered.
          </p>
        : null}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Command center">
        {groups.map((g) => (
          <div key={g.id} className="mb-6">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                        active ?
                          "border border-[#D4AF37]/35 bg-[#D4AF37]/10 font-medium text-[#f4efe4] shadow-[0_0_24px_rgb(212_175_55_/_0.12)]"
                        : "border border-transparent text-neutral-400 hover:border-[#333] hover:bg-white/[0.03] hover:text-[#f0ebe0]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-[#1a1a1a] px-4 py-3 text-[10px] leading-relaxed text-neutral-600">
        Premium operations shell — advisory signals only.
      </div>
    </aside>
  );
}
