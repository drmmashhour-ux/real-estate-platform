import Link from "next/link";
import type { ReactNode } from "react";

export default function OwnerBrokerageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-amber-900/30 bg-black/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 text-xs">
          <span className="font-semibold uppercase tracking-widest text-amber-200/80">LECIPM · résidentiel</span>
          <nav className="flex flex-wrap gap-2">
            <Link href="../" className="text-zinc-500 hover:text-amber-200/90">
              Propriétaire (accueil)
            </Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </div>
  );
}
