"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const HREF_SELF = "/buying/by-yourself";
const HREF_BROKER = "/buying/with-platform-broker";

const labelSelf = "Buying by yourself";
const labelBroker = "Buying with platform broker";

type Mode = "header-desktop" | "header-mobile" | "mvp" | "marketing-desktop" | "marketing-mobile";

export function BuyingNavGroup({
  mode,
  onNavigate,
}: {
  mode: Mode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const p = pathname ? pathname.replace(/\/$/, "") || "/" : "/";
  const buyingActive = p === "/buying" || p.startsWith("/buying/");
  const selfActive = p === HREF_SELF || p.startsWith(`${HREF_SELF}/`);
  const brokerActive = p === HREF_BROKER || p.startsWith(`${HREF_BROKER}/`);

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

  const linkSelf = (
    <Link
      href={HREF_SELF}
      onClick={() => {
        onNavigate?.();
        close();
      }}
      className={
        mode === "header-mobile" || mode === "marketing-mobile"
          ? [
              "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
              selfActive ? "bg-[#C9A646]/15 text-[#C9A646]" : "text-slate-300 hover:bg-white/5 hover:text-white",
            ].join(" ")
          : mode === "marketing-desktop"
            ? "block rounded-md px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-[#C9A646]"
            : "block rounded-md px-3 py-2 text-sm text-left text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
      }
      aria-current={selfActive ? "page" : undefined}
    >
      {labelSelf}
    </Link>
  );

  const linkBroker = (
    <Link
      href={HREF_BROKER}
      onClick={() => {
        onNavigate?.();
        close();
      }}
      className={
        mode === "header-mobile" || mode === "marketing-mobile"
          ? [
              "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
              brokerActive ? "bg-[#C9A646]/15 text-[#C9A646]" : "text-slate-300 hover:bg-white/5 hover:text-white",
            ].join(" ")
          : mode === "marketing-desktop"
            ? "block rounded-md px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-[#C9A646]"
            : "block rounded-md px-3 py-2 text-sm text-left text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
      }
      aria-current={brokerActive ? "page" : undefined}
    >
      {labelBroker}
    </Link>
  );

  if (mode === "header-mobile" || mode === "marketing-mobile") {
    return (
      <div className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Buying</p>
        {linkSelf}
        {linkBroker}
      </div>
    );
  }

  const buttonClass =
    mode === "mvp"
      ? [
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition",
          buyingActive
            ? "bg-[#C9A646]/12 text-[#E8D5A3] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-[#C9A646]/45"
            : "text-slate-300 hover:bg-white/[0.04] hover:text-white",
        ].join(" ")
      : mode === "marketing-desktop"
        ? [
            "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-300 transition hover:text-[#C9A646]",
            buyingActive ? "text-[#C9A646]" : "",
          ].join(" ")
        : [
            "relative inline-flex items-center gap-1 text-sm font-semibold transition duration-200",
            buyingActive ? "text-[#E8D5A3]" : "text-[#B3B3B3] hover:text-white",
          ].join(" ");

  const panelClass =
    mode === "mvp"
      ? "absolute left-0 top-full z-[100] mt-1 min-w-[16.5rem] rounded-xl border border-white/10 bg-[#121212] py-1 shadow-xl shadow-black/50"
      : mode === "marketing-desktop"
        ? "absolute left-0 top-full z-[100] mt-1 min-w-[17rem] rounded-xl border border-white/10 bg-[#141414] py-1 shadow-xl"
        : "absolute left-1/2 top-full z-[100] mt-2 min-w-[17rem] -translate-x-1/2 rounded-xl border border-white/10 bg-[#121212]/98 py-1 shadow-xl shadow-black/50 backdrop-blur-md";

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
        aria-controls={`${btnId}-buying-menu`}
        onClick={() => setOpen((o) => !o)}
      >
        Buying
        <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {buyingActive && mode === "header-desktop" ? (
        <span
          className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 max-w-[2.25rem] rounded-full bg-[#C9A646]"
          aria-hidden
        />
      ) : null}
      {open ? (
        <div
          id={`${btnId}-buying-menu`}
          role="menu"
          className={panelClass}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div role="none">{linkSelf}</div>
          <div role="none">{linkBroker}</div>
        </div>
      ) : null}
    </div>
  );
}
