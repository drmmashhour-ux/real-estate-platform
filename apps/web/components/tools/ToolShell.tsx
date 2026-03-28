import Link from "next/link";

export function ToolShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200">
      <div className="border-b border-premium-gold/20 bg-black/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-premium-gold">LECIPM tools</p>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <Link href="/" className="text-sm text-premium-gold hover:text-premium-gold">
            ← Home
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}

export function LegalDisclaimerBlock() {
  return (
    <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-100/90">
      <p className="font-semibold text-amber-200">Important</p>
      <p className="mt-2">
        Informational estimate only. Not legal, tax, mortgage, or accounting advice. Rates, rebates, and rules may change.
        Verify with an accountant, notary, broker, or mortgage professional.
      </p>
    </div>
  );
}
