export function ListingTrustAiSection(props: { title: string; lines: string[] }) {
  if (props.lines.length === 0) return null;
  return (
    <section
      className="rounded-[var(--darlink-radius-2xl)] border border-amber-200/80 bg-amber-50/50 p-4 shadow-[var(--darlink-shadow-sm)]"
      aria-label={props.title}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">{props.title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-950/90 [text-wrap:pretty]">
        {props.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
