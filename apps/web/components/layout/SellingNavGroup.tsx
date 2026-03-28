"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const HREF_SELF = "/selling/by-yourself";
const HREF_PLATFORM = "/selling/with-platform-broker";
const HREF_CERTIFIED = "/selling/with-certified-broker";

const labelSelf = "Sell by yourself";
const labelPlatform = "Sell with platform broker";
const labelCertified = "Sell with certified broker";

type Mode = "header-desktop" | "header-mobile" | "mvp" | "marketing-desktop" | "marketing-mobile";

function linkClass(
  mode: Mode,
  active: boolean
): string {
  if (mode === "header-mobile" || mode === "marketing-mobile") {
    return [
      "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
      active ? "bg-premium-gold/15 text-premium-gold" : "text-slate-300 hover:bg-white/5 hover:text-white",
    ].join(" ");
  }
  if (mode === "marketing-desktop") {
    return "block rounded-md px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-premium-gold";
  }
  return "block rounded-md px-3 py-2 text-sm text-left text-slate-200 transition hover:bg-white/[0.08] hover:text-white";
}

export function SellingNavGroup({
  mode,
  onNavigate,
}: {
  mode: Mode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const p = pathname ? pathname.replace(/\/$/, "") || "/" : "/";
  const sellingActive = p === "/selling" || p.startsWith("/selling/");
  const selfActive = p === HREF_SELF || p.startsWith(`${HREF_SELF}/`);
  const platformActive = p === HREF_PLATFORM || p.startsWith(`${HREF_PLATFORM}/`);
  const certifiedActive = p === HREF_CERTIFIED || p.startsWith(`${HREF_CERTIFIED}/`);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const mk = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      onClick={() => {
        onNavigate?.();
        close();
      }}
      className={linkClass(mode, active)}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );

  if (mode === "header-mobile" || mode === "marketing-mobile") {
    return (
      <div className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Selling</p>
        {mk(HREF_SELF, labelSelf, selfActive)}
        {mk(HREF_PLATFORM, labelPlatform, platformActive)}
        {mk(HREF_CERTIFIED, labelCertified, certifiedActive)}
      </div>
    );
  }

  const buttonClass =
    mode === "mvp"
      ? [
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition",
          sellingActive
            ? "bg-premium-gold/12 text-premium-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-premium-gold/45"
            : "text-slate-300 hover:bg-white/[0.04] hover:text-white",
        ].join(" ")
      : mode === "marketing-desktop"
        ? [
            "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-300 transition hover:text-premium-gold",
            sellingActive ? "text-premium-gold" : "",
          ].join(" ")
        : [
            "relative inline-flex items-center gap-1 text-sm font-semibold transition duration-200",
            sellingActive ? "text-premium-gold" : "text-[#B3B3B3] hover:text-white",
          ].join(" ");

  const panelClass =
    mode === "mvp"
      ? "absolute left-0 top-full z-[100] mt-1 min-w-[19rem] rounded-xl border border-white/10 bg-[#121212] py-1 shadow-xl shadow-black/50"
      : mode === "marketing-desktop"
        ? "absolute left-0 top-full z-[100] mt-1 min-w-[19.5rem] rounded-xl border border-white/10 bg-[#141414] py-1 shadow-xl"
        : "absolute left-1/2 top-full z-[100] mt-2 min-w-[19.5rem] -translate-x-1/2 rounded-xl border border-white/10 bg-[#121212]/98 py-1 shadow-xl shadow-black/50 backdrop-blur-md";

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        if (mode === "header-desktop" || mode === "mvp" || mode === "marketing-desktop") setOpen(true);
      }}
      onMouseLeave={() => {
        if (mode === "header-desktop" || mode === "mvp" || mode === "marketing-desktop") setOpen(false);
      }}
    >
      <button
        type="button"
        id={btnId}
        className={buttonClass}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`${btnId}-selling-menu`}
        onClick={() => setOpen((o) => !o)}
      >
        Selling
        <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {sellingActive && mode === "header-desktop" ? (
        <span
          className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 max-w-[2.25rem] rounded-full bg-premium-gold"
          aria-hidden
        />
      ) : null}
      {open ? (
        <div
          id={`${btnId}-selling-menu`}
          role="menu"
          className={panelClass}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div role="none">{mk(HREF_SELF, labelSelf, selfActive)}</div>
          <div role="none">{mk(HREF_PLATFORM, labelPlatform, platformActive)}</div>
          <div role="none">{mk(HREF_CERTIFIED, labelCertified, certifiedActive)}</div>
        </div>
      ) : null}
    </div>
  );
}
