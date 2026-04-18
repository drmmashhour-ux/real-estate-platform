export function BrokerRiskPanel({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-red-200/90">Compliance &amp; risk reminders</h2>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-100/85">
        {lines.length === 0 ? <li className="text-red-200/50">No automated flags — keep verifying source documents.</li> : lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </div>
  );
}
