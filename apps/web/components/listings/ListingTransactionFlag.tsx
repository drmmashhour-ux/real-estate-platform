import type { ListingTransactionFlag as ListingTransactionFlagValue } from "@/lib/fsbo/listing-transaction-flag";

const TONE_CLASS: Record<ListingTransactionFlagValue["tone"], string> = {
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  slate: "border-slate-400/30 bg-slate-400/10 text-slate-200",
};

export function ListingTransactionFlag({ flag }: { flag: ListingTransactionFlagValue }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold leading-snug tracking-wide ${TONE_CLASS[flag.tone]}`}
    >
      {flag.label}
    </span>
  );
}
