"use client";

import type { ReactNode } from "react";

export function FormPreviewShell({
  formKey,
  title,
  children,
}: {
  formKey: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-ds-gold/20 bg-black/40 p-4">
      <div className="rounded-lg border border-amber-500/25 bg-amber-950/15 px-3 py-2 text-xs text-amber-100/85">
        <strong className="text-amber-200">Draft preview — {formKey}</strong>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-100/70">
          {title}. Not an official execution document. Broker review required before any transfer to publisher-authorized
          forms.
        </p>
      </div>
      {children}
    </div>
  );
}
