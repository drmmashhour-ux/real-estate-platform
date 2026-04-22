"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";

import type { LecipmShellRole, NavSection, QuickAction } from "@/config/navigation.config";
import { isNavPathActive, resolveDashboardHref } from "@/config/navigation.config";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { LecipmNavIcon } from "@/components/layouts/lecipm-nav-icon";

const GOLD = "#D4AF37";
const STORAGE_KEY = "lecipm:dashboard-sidebar-collapsed";

export type RoleOption = {
  role: LecipmShellRole;
  label: string;
  href: string;
};

export type DashboardShellProps = {
  base: string;
  /** Current workspace */
  shellRole: LecipmShellRole;
  roleLabel: string;
  sections: NavSection[];
  quickActions: QuickAction[];
  /** Shown only when length > 1 */
  roleOptions: RoleOption[];
  userDisplayName?: string | null;
  /** Default false; set true when app uses a custom wordmark elsewhere */
  hideLogoText?: boolean;
  children: ReactNode;
};

function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function BreadcrumbRow({
  base,
  pathname,
  shellRole,
}: {
  base: string;
  pathname: string;
  shellRole: LecipmShellRole;
}) {
  const segments = useMemo(() => {
    const path = pathname.replace(/\/+$/, "");
    const baseClean = base.replace(/\/+$/, "");
    const rest = path.startsWith(baseClean) ? path.slice(baseClean.length) : path;
    const raw = rest.split("/").filter(Boolean);
    const roleSegment =
      shellRole === "RESIDENCE" ? "residence" : shellRole === "MANAGEMENT" ? "management" : "admin";
    const withoutRole = raw[0] === roleSegment ? raw.slice(1) : raw;
    return withoutRole;
  }, [pathname, base, shellRole]);

  const roleSegment =
    shellRole === "RESIDENCE" ? "residence" : shellRole === "MANAGEMENT" ? "management" : "admin";
  const roleLabel =
    shellRole === "RESIDENCE" ? "Residence" : shellRole === "MANAGEMENT" ? "Management" : "Admin";

  const items: { label: string; href: string | null }[] = [
    { label: "Dashboard", href: base },
    { label: roleLabel, href: `${base}/${roleSegment}` },
  ];

  segments.forEach((seg, i) => {
    const href = `${base}/${roleSegment}/${segments.slice(0, i + 1).join("/")}`;
    const isLast = i === segments.length - 1;
    items.push({ label: titleCase(seg), href: isLast ? null : href });
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
      {items.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
          {idx > 0 ?
            <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
          : null}
          {item.href ?
            <Link href={item.href} className="hover:text-zinc-200">
              {item.label}
            </Link>
          : <span className="font-medium text-zinc-200">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const items = [
    { id: "1", title: "New leads", body: "Inquiry volume is up today — review queue." },
    { id: "2", title: "Response SLA", body: "Some leads are waiting longer than target." },
    { id: "3", title: "Approvals", body: "Operator verification may need your sign-off." },
  ];
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/60 lg:hidden" aria-label="Close" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <p className="text-sm font-semibold text-zinc-100">Notifications</p>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-3 max-h-80 space-y-3 overflow-auto text-sm">
          {items.map((n) => (
            <li key={n.id} className="rounded-lg border border-white/5 bg-black/40 p-3">
              <p className="font-medium text-zinc-100">{n.title}</p>
              <p className="mt-1 text-zinc-500">{n.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

type LecipmSidebarNavProps = {
  base: string;
  sections: NavSection[];
  collapsed: boolean;
  isActive: (itemPath: string) => boolean;
  onNavigate?: () => void;
};

function LecipmSidebarNav({ base, sections, collapsed, isActive, onNavigate }: LecipmSidebarNavProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          {section.title ?
            <p
              className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ${collapsed ? "sr-only" : ""}`}
            >
              {section.title}
            </p>
          : null}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const href = resolveDashboardHref(base, item.path);
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    title={collapsed ? item.shortLabel ?? item.label : undefined}
                    onClick={onNavigate}
                    className={[
                      "group relative flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors",
                      collapsed ? "justify-center px-2" : "px-3",
                      active ?
                        "border-l-2 font-semibold text-white"
                      : "border-l-2 border-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
                    ].join(" ")}
                    style={
                      active ?
                        {
                          borderLeftColor: GOLD,
                          backgroundColor: "rgba(212, 175, 55, 0.12)",
                        }
                      : undefined
                    }
                  >
                    <LecipmNavIcon
                      name={item.icon}
                      className={`h-[1.15rem] w-[1.15rem] shrink-0 ${active ? "" : "opacity-80 group-hover:opacity-100"}`}
                    />
                    {!collapsed ?
                      <span>{item.label}</span>
                    : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function LecipmDashboardShell(props: DashboardShellProps) {
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "1") setCollapsed(true);
      } catch {
        /* ignore */
      }
    });
  }, []);

  const persistCollapse = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const closeOverlays = useCallback(() => {
    setMobileNavOpen(false);
    setNotificationsOpen(false);
    setQuickOpen(false);
    setRoleOpen(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => closeOverlays());
  }, [pathname, closeOverlays]);

  const sidebarW = collapsed ? "w-[4.25rem]" : "w-[16.5rem]";

  const isActiveHref = useCallback(
    (itemPath: string) => {
      const href = resolveDashboardHref(props.base, itemPath);
      if (href === pathname) return true;
      if (pathname.startsWith(`${href}/`)) return true;
      return false;
    },
    [pathname, props.base],
  );

  const residenceMobile = props.shellRole === "RESIDENCE";

  const mobileBottomItems = useMemo(() => {
    if (!residenceMobile) return [];
    return [
      { path: "residence", icon: "home", label: "Home" },
      { path: "residence/leads", icon: "inbox", label: "Leads" },
      { path: "residence/calendar", icon: "calendar", label: "Visits" },
      { path: "residence/messages", icon: "message", label: "Msgs" },
      { kind: "menu" as const },
    ];
  }, [residenceMobile]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-black/90 px-3 backdrop-blur md:px-4 lg:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href={props.base} className="flex items-center gap-2 pr-2">
          <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-md">
            <Image src="/branding/logo-icon.svg" alt="" width={32} height={32} className="object-contain" priority />
          </span>
          {!props.hideLogoText ?
            <span className="hidden font-semibold tracking-tight text-white sm:inline">{PLATFORM_NAME}</span>
          : null}
        </Link>

        <span
          className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300 md:inline-flex"
          style={{ borderColor: `${GOLD}44` }}
        >
          {props.roleLabel}
        </span>

        <div className="mx-auto hidden max-w-md flex-1 md:flex">
          <label className="relative flex w-full items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" aria-hidden />
            <input
              type="search"
              placeholder="Quick search…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
              autoComplete="off"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick action</span>
            </button>
            {quickOpen ?
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setQuickOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border border-white/10 bg-zinc-950 py-2 shadow-xl">
                  {props.quickActions.map((a) => (
                    <Link
                      key={a.id}
                      href={resolveDashboardHref(props.base, a.path)}
                      className="block px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/10"
                      onClick={() => setQuickOpen(false)}
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              </>
            : null}
          </div>

          <div className="relative">
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 hover:bg-white/10"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D4AF37]" aria-hidden />
            </button>
            <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
          </div>

          {props.roleOptions.length > 1 ?
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setRoleOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10"
              >
                Switch role
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {roleOpen ?
                <>
                  <button type="button" className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setRoleOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-xl border border-white/10 bg-zinc-950 py-2 shadow-xl">
                    {props.roleOptions.map((r) => (
                      <Link
                        key={r.role}
                        href={r.href}
                        className={`block px-4 py-2.5 text-sm hover:bg-white/10 ${r.role === props.shellRole ? "text-[#D4AF37]" : "text-zinc-200"}`}
                        onClick={() => setRoleOpen(false)}
                      >
                        {r.label}
                      </Link>
                    ))}
                  </div>
                </>
              : null}
            </div>
          : null}

          <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5">
            <span className="hidden max-w-[10rem] truncate text-xs text-zinc-400 lg:inline">{props.userDisplayName ?? "Account"}</span>
            <User className="h-5 w-5 text-zinc-400" aria-hidden />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-white/10 bg-black/60 lg:flex ${sidebarW} transition-[width] duration-200`}
        >
          <div className="flex items-center justify-between border-b border-white/5 p-2">
            <button
              type="button"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
              onClick={() => persistCollapse(!collapsed)}
            >
              {collapsed ?
                <PanelLeftClose className="h-5 w-5 rotate-180" />
              : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <LecipmSidebarNav
              base={props.base}
              sections={props.sections}
              collapsed={collapsed}
              isActive={isActiveHref}
            />
          </nav>
        </aside>

        {/* Mobile / tablet drawer */}
        {mobileNavOpen ?
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-white/10 bg-zinc-950 shadow-2xl lg:hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <span className="text-sm font-semibold">{props.roleLabel}</span>
                <button type="button" className="rounded p-2 hover:bg-white/10" aria-label="Close" onClick={() => setMobileNavOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <LecipmSidebarNav
                  base={props.base}
                  sections={props.sections}
                  collapsed={false}
                  isActive={isActiveHref}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              </nav>
            </aside>
          </>
        : null}

        <main className="min-h-[calc(100vh-3.5rem)] flex-1 px-4 py-6 pb-24 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <BreadcrumbRow base={props.base} pathname={pathname} shellRole={props.shellRole} />
            {props.children}
          </div>
        </main>
      </div>

      {/* Residence bottom nav — max 5; "Menu" opens drawer */}
      {residenceMobile && mobileBottomItems.length > 0 ?
        <nav
          className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden"
          aria-label="Primary"
        >
          {mobileBottomItems.map((item, idx) => {
            if ("kind" in item && item.kind === "menu") {
              return (
                <button
                  key="menu"
                  type="button"
                  className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] text-zinc-400"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  Menu
                </button>
              );
            }
            const href = resolveDashboardHref(props.base, item.path);
            const active = isNavPathActive(pathname, props.base, item.path);
            return (
              <Link
                key={`${item.path}-${idx}`}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${active ? "text-[#D4AF37]" : "text-zinc-400"}`}
              >
                <LecipmNavIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      : null}
    </div>
  );
}
