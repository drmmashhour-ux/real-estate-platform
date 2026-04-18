"use client";

export function LeadConversionHelper() {
  const steps = [
    "Confirm lead source and consent log (platform traceability).",
    "Qualify budget + timeline — document in CRM, not in marketing claims.",
    "Book showing / strategy call — send calendar link with clear fee disclosure.",
    "Offer ROI or pricing transparency tools as **decision support**, not promises.",
    "Close with written next steps — Stripe or deal fees explained before signature.",
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-200">
      <h2 className="text-lg font-semibold text-white">Lead → deal checklist</h2>
      <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-zinc-400">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
