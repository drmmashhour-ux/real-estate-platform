import type { ReactNode } from "react";

export function ConversionSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
