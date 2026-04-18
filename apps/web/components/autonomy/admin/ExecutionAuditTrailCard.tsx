export function ExecutionAuditTrailCard(props: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Audit pointers</p>
      <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
        {props.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
