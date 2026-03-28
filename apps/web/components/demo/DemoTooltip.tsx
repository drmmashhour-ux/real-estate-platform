"use client";

import type { ReactNode } from "react";

export function DemoTooltip({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-premium-gold)" }}>
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{children}</p>
    </div>
  );
}
