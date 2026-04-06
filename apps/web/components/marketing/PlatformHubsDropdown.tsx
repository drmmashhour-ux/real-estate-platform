"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  HUB_LINKS_ADMIN,
  HUB_LINKS_DASHBOARDS,
  HUB_LINKS_PUBLIC,
  HUB_LINKS_SUPPORT,
  HUB_LINKS_TOOLS,
} from "@/lib/marketing/platform-hub-links";

function Col({
  title,
  links,
  mutedHint,
  onPick,
  linkClass,
}: {
  title: string;
  links: { href: string; label: string; hint?: string }[];
  mutedHint?: string;
  onPick?: () => void;
  linkClass: string;
}) {
  return (
    <div className="min-w-[11rem]">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      {mutedHint ? <p className="mb-1 px-3 text-[10px] text-slate-600">{mutedHint}</p> : null}
      <ul className="space-y-0.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} onClick={() => onPick?.()} className={linkClass}>
              <span className="font-medium">{l.label}</span>
              {l.hint ? <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{l.hint}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Mode = "marketing-desktop" | "marketing-mobile";

export function PlatformHubsDropdown({ mode, onNavigate }: { mode: Mode; onNavigate?: () => void }) {
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

  const pick = useCallback(() => {
    setOpen(false);
    onNavigate?.();
  }, [onNavigate]);

  const linkDesktop =
    "block rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-premium-gold";
  const linkMobile =
    "block rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 hover:text-premium-gold";

  const columns = (
    <>
      <Col title="Browse" links={HUB_LINKS_PUBLIC} onPick={pick} linkClass={mode === "marketing-mobile" ? linkMobile : linkDesktop} />
      <Col title="Tools & AI" links={HUB_LINKS_TOOLS} onPick={pick} linkClass={mode === "marketing-mobile" ? linkMobile : linkDesktop} />
      <Col
        title="Workspaces"
        links={HUB_LINKS_DASHBOARDS}
        mutedHint="Sign in required"
        onPick={pick}
        linkClass={mode === "marketing-mobile" ? linkMobile : linkDesktop}
      />
      <Col title="Support" links={HUB_LINKS_SUPPORT} onPick={pick} linkClass={mode === "marketing-mobile" ? linkMobile : linkDesktop} />
      <Col
        title="Operations"
        links={HUB_LINKS_ADMIN}
        mutedHint="Authorized staff"
        onPick={pick}
        linkClass={mode === "marketing-mobile" ? linkMobile : linkDesktop}
      />
    </>
  );

  if (mode === "marketing-mobile") {
    return (
      <div className="border-t border-white/10 pt-2">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Platform hubs</p>
        <Link
          href="/#hubs"
          className="mb-3 block rounded-lg px-3 py-2.5 text-sm font-medium text-premium-gold hover:bg-white/5"
          onClick={() => onNavigate?.()}
        >
          Card overview on homepage →
        </Link>
        <div className="space-y-4">{columns}</div>
      </div>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={btnId}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-premium-gold"
      >
        Hubs
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[80] mt-2 min-w-[min(100vw-2rem,56rem)] rounded-xl border border-white/15 bg-[#141414] p-4 shadow-2xl shadow-black/50">
          <div className="flex flex-wrap gap-6 lg:gap-8">{columns}</div>
        </div>
      ) : null}
    </div>
  );
}
