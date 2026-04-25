"use client";

import Link from "next/link";
import { LecipmEsignatureDisclaimer } from "./LecipmEsignatureDisclaimer";

export type EnvelopeListRow = {
  id: string;
  title: string;
  status: string;
  dealId: string;
  documentHashSha256: string | null;
  createdAt: Date;
  deal: { id: string; dealCode: string | null } | null;
};

export function SignatureDashboardClient({ initial }: { initial: EnvelopeListRow[] }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div>
        <h1 className="font-serif text-2xl text-zinc-100">Transaction signatures</h1>
        <p className="mt-1 text-zinc-400">
          LECIPM evidentiary e-sign envelopes for deal documents. Immutable hashes and audit events are stored per envelope.
        </p>
      </div>

      <LecipmEsignatureDisclaimer />

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60">
        <div className="border-b border-zinc-800 px-4 py-3 font-medium text-zinc-200">Your envelopes</div>
        {initial.length === 0 ? (
          <p className="px-4 py-8 text-zinc-500">No envelopes yet. Create one via POST /api/signature/envelopes or your deal workflow.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {initial.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/dashboard/signature/${e.id}`} className="font-medium text-amber-400 hover:text-amber-300">
                    {e.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {e.deal?.dealCode ?? e.dealId} · {e.status}
                    {e.documentHashSha256 ? ` · sha256:${e.documentHashSha256.slice(0, 12)}…` : ""}
                  </p>
                </div>
                <span className="text-[10px] uppercase text-zinc-500">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
