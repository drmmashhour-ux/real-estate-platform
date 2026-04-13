import type { ReactNode } from "react";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-serif text-lg font-medium tracking-tight text-premium-gold/95 md:text-xl">{children}</h3>
  );
}

function GoldRule() {
  return <div className="h-px w-12 bg-gradient-to-r from-premium-gold/60 to-transparent" aria-hidden />;
}

function missingKeyToLabel(key: string): string {
  switch (key) {
    case "cadastre":
      return "Cadastre or lot number";
    case "seller declaration":
      return "Seller declaration";
    case "photos":
      return "Property photography";
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

function completePhrase(s: string): string {
  if (s === "photos uploaded") return "Gallery photos added";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type SellerAiAssistPanel =
  | { variant: "price"; data: Record<string, unknown> }
  | { variant: "description"; data: Record<string, unknown> }
  | { variant: "completeness"; data: Record<string, unknown> }
  | { variant: "error"; message: string };

export function SellerAiAssistResult({ panel }: { panel: SellerAiAssistPanel }) {
  if (panel.variant === "error") {
    return (
      <div
        className="mt-4 rounded-xl border border-red-500/25 bg-red-950/20 px-4 py-3 text-sm leading-relaxed text-red-100/95"
        role="alert"
      >
        {panel.message}
      </div>
    );
  }

  const { data } = panel;
  const summary = typeof data.summary === "string" ? data.summary : "";

  if (panel.variant === "price") {
    const bullets = Array.isArray(data.bullets)
      ? data.bullets.filter((x): x is string => typeof x === "string")
      : [];
    return (
      <div className="mt-4 space-y-4 rounded-xl border border-white/[0.08] bg-gradient-to-b from-black/40 to-black/25 px-5 py-5 shadow-inner shadow-black/20">
        <div className="space-y-2">
          <SectionTitle>Price positioning</SectionTitle>
          <GoldRule />
          <p className="text-sm leading-relaxed text-slate-200/95">{summary}</p>
        </div>
        {bullets.length > 0 ? (
          <ul className="space-y-3 border-t border-white/[0.06] pt-4">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300/95">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-premium-gold/80 shadow-[0_0_8px_rgba(212,175,55,0.35)]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-xs leading-relaxed text-slate-500">
          Illustrative band only — confirm strategy with your licensed professional before committing to a number.
        </p>
      </div>
    );
  }

  if (panel.variant === "description") {
    const updated = data.updated === true;
    return (
      <div className="mt-4 space-y-3 rounded-xl border border-white/[0.08] bg-gradient-to-b from-black/40 to-black/25 px-5 py-5 shadow-inner shadow-black/20">
        <div className="space-y-2">
          <SectionTitle>Listing narrative</SectionTitle>
          <GoldRule />
          <p className="text-sm leading-relaxed text-slate-200/95">{summary}</p>
        </div>
        {updated ? (
          <p className="border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-slate-400">
            Your description field has been refreshed from the saved listing. Open{" "}
            <span className="text-slate-300">Property details</span> to refine tone and detail before publishing.
          </p>
        ) : null}
      </div>
    );
  }

  const missing = Array.isArray(data.missing) ? data.missing.filter((x): x is string => typeof x === "string") : [];
  const complete = Array.isArray(data.complete) ? data.complete.filter((x): x is string => typeof x === "string") : [];
  const hasGaps = missing.length > 0;

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/[0.08] bg-gradient-to-b from-black/40 to-black/25 px-5 py-5 shadow-inner shadow-black/20">
      <div className="space-y-2">
        <SectionTitle>Listing readiness</SectionTitle>
        <GoldRule />
        <p className="text-sm leading-relaxed text-slate-200/95">{summary}</p>
      </div>

      {complete.length > 0 ? (
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">In good order</p>
          <ul className="mt-2 space-y-2">
            {complete.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-200/85">
                <span className="mt-0.5 text-emerald-400/90" aria-hidden>
                  ✓
                </span>
                <span>{completePhrase(c)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasGaps ? (
        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Recommended next steps</p>
          <ul className="mt-3 space-y-2.5">
            {missing.map((m, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300/95">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.25)]"
                  aria-hidden
                />
                <span>{missingKeyToLabel(m)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasGaps && complete.length === 0 ? (
        <p className="text-xs text-slate-500">Review your presentation and disclosures before inviting buyers.</p>
      ) : null}
    </div>
  );
}
