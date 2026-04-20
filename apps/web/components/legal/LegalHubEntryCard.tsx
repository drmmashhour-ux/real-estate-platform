import Link from "next/link";

export function LegalHubEntryCard({
  href,
  locale,
  country,
}: {
  href: string;
  locale: string;
  country: string;
}) {
  return (
    <section className="rounded-2xl border border-premium-gold/25 bg-black/35 p-4 sm:p-5" aria-label="Legal hub entry">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-premium-gold">Compliance</p>
          <h2 className="mt-1 text-base font-semibold text-white">Legal &amp; compliance workspace</h2>
          <p className="mt-1 max-w-xl text-xs text-[#9CA3AF]">
            Documents, workflow status, and readiness for operator review — platform guidance only.
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold transition-colors hover:bg-premium-gold/15"
        >
          Open Legal Hub
        </Link>
      </div>
      <p className="mt-3 text-[11px] text-[#525252]">
        Locale {locale.toUpperCase()} · {country.toUpperCase()}
      </p>
    </section>
  );
}
