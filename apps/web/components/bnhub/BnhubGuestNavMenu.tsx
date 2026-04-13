"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HelpCircle, Home, LayoutDashboard, Menu, PlusCircle, Ticket, User, UserCircle } from "lucide-react";

const menuItem =
  "lecipm-touch flex w-full min-h-[52px] items-start gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:opacity-90";

/**
 * Guest header utility menu (Airbnb-style compact trigger, LECIPM / BNHUB links).
 * Host-specific paths stay explicit — does not replace your host dashboard UX.
 */
export function BnhubGuestNavMenu({ variant }: { variant: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const trigger =
    variant === "light"
      ? "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
      : "border border-white/25 bg-white/10 text-white hover:bg-white/15";

  const panel =
    variant === "light"
      ? "border border-slate-200 bg-white text-slate-900 shadow-xl"
      : "border border-white/15 bg-[#0f2744] text-white shadow-2xl";

  const itemLight = `${menuItem} text-slate-800 hover:bg-slate-50 focus-visible:ring-[#006ce4]`;
  const itemDark = `${menuItem} text-white hover:bg-white/10 focus-visible:ring-amber-300 focus-visible:ring-offset-[#0f2744]`;
  const itemClass = variant === "light" ? itemLight : itemDark;

  const sub = variant === "light" ? "text-xs font-normal text-slate-500" : "text-xs font-normal text-white/65";

  const divider = variant === "light" ? "my-2 border-t border-slate-100" : "my-2 border-t border-white/10";

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`lecipm-touch flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full px-3 py-2 ${trigger}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 shrink-0" aria-hidden />
        <User className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
      </button>
      {open ? (
        <div
          className={`absolute right-0 z-[80] mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-[min(24rem,calc(100dvh-5rem))] overflow-y-auto overscroll-contain rounded-2xl py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch] ${panel}`}
          role="menu"
        >
          <Link href="/bnhub/become-host" className={itemClass} role="menuitem" onClick={close}>
            <Home className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>
              <span className="block font-semibold">List your space</span>
              <span className={sub}>Apply to host short-term stays on BNHUB</span>
            </span>
          </Link>
          <Link href="/bnhub/host/listings/new" className={itemClass} role="menuitem" onClick={close}>
            <PlusCircle className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>
              <span className="block">New listing</span>
              <span className={sub}>Create a draft from the host flow</span>
            </span>
          </Link>
          <Link href="/bnhub/host/dashboard" className={itemClass} role="menuitem" onClick={close}>
            <LayoutDashboard className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>Host dashboard</span>
          </Link>
          <Link href="/dashboard/bnhub" className={itemClass} role="menuitem" onClick={close}>
            <UserCircle className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>
              <span className="block font-semibold">Client dashboard</span>
              <span className={sub}>Trips, bookings &amp; messages</span>
            </span>
          </Link>
          <div className={divider} role="separator" />
          <Link href="/bnhub/find-reservation" className={itemClass} role="menuitem" onClick={close}>
            <Ticket className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>
              <span className="block font-semibold">Find my reservation</span>
              <span className={sub}>Enter your confirmation code after sign-in</span>
            </span>
          </Link>
          <Link href="/support" className={itemClass} role="menuitem" onClick={close}>
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>Help &amp; support</span>
          </Link>
          <div className={divider} role="separator" />
          <Link href="/bnhub/login" className={itemClass} role="menuitem" onClick={close}>
            <User className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span>Log in or sign up</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
