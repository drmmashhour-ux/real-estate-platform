"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useShareMyStayOptional } from "./ShareMyStayContext";

type Props = {
  bookingId: string;
  className?: string;
  /** When inside ShareMyStayRoot, opens the flow instead of navigating */
  variant?: "primary" | "subtle";
};

export function ShareMyStayButton({ bookingId, className = "", variant = "primary" }: Props) {
  const ctx = useShareMyStayOptional();

  const primary =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/30 hover:bg-emerald-400"
      : "inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20";

  if (!ctx) {
    return (
      <Link href={`/bnhub/booking/${bookingId}#share-my-stay`} className={`${primary} ${className}`}>
        <MapPin className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        Share My Stay
      </Link>
    );
  }

  if (ctx.active) {
    return (
      <button type="button" onClick={ctx.openManage} className={`${primary} ${className}`}>
        <MapPin className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        Manage sharing
      </button>
    );
  }

  return (
    <button type="button" onClick={ctx.openStartModal} className={`${primary} ${className}`}>
      <MapPin className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      Share My Stay
    </button>
  );
}
