export function TrustImprovementPanel(props: { items: string[] }) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/25 bg-black/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Actions to improve trust</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#e8dfd0]">
        {props.items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Suggestions are operational nudges — route through assistants or admins as your policy allows.
      </p>
    </div>
  );
}
