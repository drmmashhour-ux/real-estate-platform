"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

type Props = {
  variant: "ended" | "unavailable";
  title?: string;
  message: string;
  showBrowseLink?: boolean;
};

export function PublicShareInactiveState({
  variant,
  title,
  message,
  showBrowseLink = true,
}: Props) {
  const heading =
    title ?? (variant === "ended" ? "Sharing has ended" : "Shared stay");

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl shadow-black/40">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
          <Shield className="h-6 w-6 text-slate-500" aria-hidden />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-white">{heading}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{message}</p>
        {showBrowseLink ? (
          <Link
            href="/bnhub/stays"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
          >
            Browse BNHUB stays
          </Link>
        ) : null}
      </div>
    </div>
  );
}
