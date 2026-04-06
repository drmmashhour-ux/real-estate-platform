import Link from "next/link";

type Props = {
  /** When true, show compact layout for small screens */
  className?: string;
};

/**
 * Quick actions (gold) + system status trust signal. Extensible for webhook/provider health later.
 */
export function AdminCommandBar({ className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end ${className}`.trim()}
    >
      <div
        className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
        title="Core app and API responding"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        System operational
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/listings/new"
          className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/25"
        >
          + Add Listing
        </Link>
        <Link
          href="/admin/bnhub/stays/new"
          className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/25"
        >
          + Add Stay
        </Link>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
        >
          AdminHub →
        </Link>
      </div>
    </div>
  );
}
