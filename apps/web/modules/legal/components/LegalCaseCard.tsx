import Link from "next/link";

export type LegalCaseCardModel = {
  id: string;
  title: string;
  jurisdiction: string;
  latentDefect: boolean;
  sellerLiable: boolean;
};

export function LegalCaseCard({ c, detailHref }: { c: LegalCaseCardModel; detailHref: string }) {
  return (
    <Link
      href={detailHref}
      className="block rounded-xl border border-white/10 bg-black/50 p-4 transition hover:border-premium-gold/40"
    >
      <p className="text-sm font-medium text-white">{c.title}</p>
      <p className="mt-1 text-xs text-slate-500">{c.jurisdiction}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
        {c.latentDefect ? <span className="rounded bg-slate-800 px-1.5 py-0.5">Latent defect</span> : null}
        {c.sellerLiable ? <span className="rounded bg-slate-800 px-1.5 py-0.5">Seller liable</span> : null}
      </div>
    </Link>
  );
}
