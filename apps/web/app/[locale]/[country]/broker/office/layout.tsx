import type { ReactNode } from "react";

export default function BrokerOfficeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-amber-500/15 bg-black/60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500/90">LECIPM · Brokerage operations</p>
          <h1 className="mt-2 font-serif text-2xl tracking-tight text-white">Office workspace</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Québec-oriented office management — amounts are configurable; manual review remains required for final accounting.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
