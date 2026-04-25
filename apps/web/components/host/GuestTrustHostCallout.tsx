import type { BnhubGuestTrustPublicSnapshot } from "@/modules/trust/trust.types";

const LABELS: Record<BnhubGuestTrustPublicSnapshot["uiLabel"], { title: string; className: string; detail: string }> = {
  trusted_guest: {
    title: "Trusted guest",
    className: "border-emerald-500/40 bg-emerald-950/35 text-emerald-100",
    detail: "Strong platform history and trust score for this account (automated assessment).",
  },
  new_user: {
    title: "New user",
    className: "border-sky-500/35 bg-sky-950/30 text-sky-100",
    detail: "Limited tenure or few completed stays — normal for new guests.",
  },
  potential_risk: {
    title: "Potential risk",
    className: "border-amber-500/45 bg-amber-950/40 text-amber-100",
    detail:
      "Elevated automated signals — review messaging and history; the platform did not block this booking. Escalate to support if unsure.",
  },
  standard: {
    title: "Standard trust",
    className: "border-zinc-600 bg-zinc-900/80 text-zinc-200",
    detail: "Typical trust range based on booking, payment, and review signals.",
  },
};

export function GuestTrustHostCallout({ trust }: { trust: BnhubGuestTrustPublicSnapshot }) {
  const cfg = LABELS[trust.uiLabel] ?? LABELS.standard;
  return (
    <aside className={`rounded-xl border px-4 py-3 text-sm ${cfg.className}`}>
      <p className="font-semibold">{cfg.title}</p>
      <p className="mt-1 text-xs opacity-90">{cfg.detail}</p>
      <p className="mt-2 font-mono text-[10px] opacity-70">
        Trust score {trust.score}/100 · risk {trust.riskLevel}
        {trust.factorCount > 0 ? ` · ${trust.factorCount} factor(s) in model` : null}
        {trust.fraudSignalCodes.length > 0 ? ` · flags: ${trust.fraudSignalCodes.join(", ")}` : null}
      </p>
    </aside>
  );
}
