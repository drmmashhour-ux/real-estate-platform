import Link from "next/link";

const STEP_ITEMS = [
  {
    n: 1,
    title: "Enter property details",
    detail: "Price, rent, and expenses",
    href: "/analyze#analyzer",
  },
  {
    n: 2,
    title: "See ROI & insights",
    detail: "Cash flow and AI summary",
    href: "/analyze#roi-insights",
  },
  {
    n: 3,
    title: "Connect with a mortgage expert",
    href: "/experts",
  },
] as const;

const TRUST_ITEMS = [
  { label: "Verified brokers", sub: "Vetted financing partners" },
  { label: "AI-powered insights", sub: "Deal narrative & suggestions" },
  { label: "Used by investors", sub: "Early-access community" },
] as const;

export function ConversionUrgencyBanner({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-xl border border-emerald-500/35 bg-emerald-950/35 px-4 py-3 text-center text-sm font-medium text-emerald-50 ${className}`}
      role="status"
    >
      <span className="text-emerald-200/95">Get instant analysis</span>
      <span className="text-emerald-100/70"> + </span>
      <span className="text-white">connect with a verified broker</span>
    </p>
  );
}

export function ConversionSteps({ className = "" }: { className?: string }) {
  return (
    <ol
      className={`grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:items-stretch ${className}`}
      aria-label="How it works"
    >
      {STEP_ITEMS.map((s) => (
        <li key={s.n} className="flex min-h-0">
          <Link
            href={s.href}
            className="flex min-h-[7.25rem] w-full gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-[#C9A646]/45 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A646]/70 sm:min-h-[7.5rem]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full bg-[#C9A646]/20 text-sm font-bold text-[#E8D5A3]"
              aria-hidden
            >
              {s.n}
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="block text-sm font-semibold leading-snug text-white">{s.title}</span>
              {"detail" in s && s.detail ? (
                <span className="mt-1 block text-xs leading-snug text-slate-500">{s.detail}</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function TrustBadgesRow({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}
      aria-label="Trust signals"
    >
      {TRUST_ITEMS.map((t) => (
        <li
          key={t.label}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-center sm:px-4"
        >
          <span className="block text-xs font-semibold text-[#E8D5A3]">{t.label}</span>
          <span className="hidden text-[11px] text-slate-500 sm:block">{t.sub}</span>
        </li>
      ))}
    </ul>
  );
}
