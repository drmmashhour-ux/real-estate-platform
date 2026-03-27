"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  accent?: string;
};

export function AISuggestionCard({ title, children, footer, accent = "#C9A646" }: Props) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 p-4"
      style={{ borderColor: `${accent}35` }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
        {title}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-200">{children}</div>
      {footer ? <div className="mt-3 border-t border-white/5 pt-3">{footer}</div> : null}
    </div>
  );
}
