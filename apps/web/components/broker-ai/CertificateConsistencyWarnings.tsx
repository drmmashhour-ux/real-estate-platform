export function CertificateConsistencyWarnings(props: { labels?: string[] }) {
  const labels = props.labels?.filter(Boolean) ?? [];
  if (labels.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Listing vs certificate fields</p>
      <ul className="mt-2 space-y-1.5 text-xs text-amber-200/90">
        {labels.map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
        Structured compare only — not a legal determination. Confirm with documents and qualified professionals.
      </p>
    </div>
  );
}
