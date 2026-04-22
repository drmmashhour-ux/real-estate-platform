"use client";

import Link from "next/link";
import { memo } from "react";

import type { NavSection } from "@/config/navigation.config";
import { isNavPathActive, resolveDashboardHref } from "@/config/navigation.config";
import { LecipmNavIcon } from "@/components/layouts/lecipm-nav-icon";

const GOLD = "#D4AF37";

export type LecipmSidebarProps = {
  base: string;
  pathname: string;
  sections: NavSection[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Desktop sticky sidebar; drawer passes false for collapsed labels always */
  mode?: "desktop" | "drawer";
  onNavigate?: () => void;
};

const NavBlocks = memo(function NavBlocks({
  base,
  pathname,
  sections,
  collapsed,
  mode,
  onNavigate,
}: Omit<LecipmSidebarProps, "onToggleCollapsed">) {
  const showLabels = mode === "drawer" || !collapsed;

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          {section.title ?
            <p
              className={`mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ${collapsed && mode !== "drawer" ? "sr-only" : ""}`}
            >
              {section.title}
            </p>
          : null}
          <nav className={mode === "desktop" ? "mt-2 space-y-1 px-2" : "space-y-1 px-2"} aria-label={section.title || "Main"}>
            {section.items.map((item) => {
              const href = resolveDashboardHref(base, item.path);
              const active = isNavPathActive(pathname, base, item.path);
              const label = item.shortLabel ?? item.label;

              return (
                <Link
                  key={item.id}
                  href={href}
                  data-nav-path={item.path}
                  title={collapsed && mode === "desktop" ? label : undefined}
                  onClick={onNavigate}
                  className={[
                    "group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-300 ease-in-out",
                    "border-l-4",
                    collapsed && mode === "desktop" ? "justify-center px-2" : "",
                    active ?
                      "border-[#D4AF37] bg-[#1f1f1f] font-semibold text-white shadow-sm"
                    : "border-transparent text-zinc-300 hover:scale-[1.02] hover:bg-[#1a1a1a] hover:text-white active:scale-[0.98]",
                  ].join(" ")}
                  style={
                    active ?
                      { borderLeftColor: GOLD }
                    : undefined
                  }
                >
                  <LecipmNavIcon
                    name={item.icon}
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "text-[#D4AF37]" : "text-zinc-400 group-hover:text-zinc-100"}`}
                  />
                  {showLabels ?
                    <span className="truncate">{item.label}</span>
                  : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
});

/**
 * Pixel-aligned dark sidebar — pairs with light main content.
 * Expanded `w-64`, collapsed `w-20`; smooth width transition.
 */
export function LecipmSidebar(props: LecipmSidebarProps) {
  const mode = props.mode ?? "desktop";
  const collapsed = props.collapsed;

  const asideWidth =
    mode === "drawer" ? "w-[min(100vw-3rem,18rem)]" : collapsed ? "w-20" : "w-64";

  return (
    <aside
      data-onboarding-anchor="sidebar"
      className={`flex h-full min-h-0 shrink-0 flex-col bg-black text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300 ease-in-out ${asideWidth}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        {mode === "desktop" ?
          <button
            type="button"
            onClick={() => props.onToggleCollapsed()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl text-[#D4AF37] transition hover:scale-105 hover:bg-[#1a1a1a] hover:text-[#D4AF37] active:scale-95"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            ☰
          </button>
        : null}
        {(!collapsed || mode === "drawer") && (
          <div className="select-none text-xl font-bold tracking-tight text-[#D4AF37]">LECIPM</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain py-4">
        <NavBlocks
          base={props.base}
          pathname={props.pathname}
          sections={props.sections}
          collapsed={collapsed}
          mode={mode}
          onNavigate={props.onNavigate}
        />
      </div>
    </aside>
  );
}
