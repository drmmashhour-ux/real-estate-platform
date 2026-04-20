import Link from "next/link";
import type { LegalDocumentItem } from "@/modules/legal/legal.types";

export function LegalDocumentsCard({ documents }: { documents: LegalDocumentItem[] }) {
  return (
    <section className="rounded-2xl border border-premium-gold/25 bg-black/40 p-5" aria-labelledby="legal-docs-heading">
      <h2 id="legal-docs-heading" className="text-sm font-semibold text-white">
        Documents & acknowledgments
      </h2>
      <p className="mt-1 text-xs text-[#737373]">Links to published terms — status reflects acceptance records only.</p>
      {documents.length === 0 ? (
        <p className="mt-4 text-sm text-[#9CA3AF]">No document rows surfaced for this session.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-sm">
              <span className="text-white/90">{d.label}</span>
              <span className="text-xs uppercase text-[#737373]">{d.status.replace(/_/g, " ")}</span>
              {d.href ? (
                <Link href={d.href} className="text-xs font-medium text-premium-gold hover:underline">
                  View
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
