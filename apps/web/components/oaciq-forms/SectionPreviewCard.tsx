"use client";

import type { ReactNode } from "react";

export function SectionPreviewCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ds-border/60 bg-black/35">
      <div className="border-b border-white/5 px-4 py-3">
        <h4 className="text-sm font-medium text-ds-text">{title}</h4>
        {description ? <p className="mt-1 text-xs text-ds-text-secondary">{description}</p> : null}
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}
