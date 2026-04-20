export function CertificateOfLocationWarningsCard(props: { blocking: string[]; warnings: string[] }) {
  const blocking = props.blocking.slice(0, 8);
  const warnings = props.warnings.slice(0, 8);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400/90">Blocking issues</p>
        {blocking.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-600">None flagged from deterministic checks.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-rose-100/90">
            {blocking.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/15 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">Warnings</p>
        {warnings.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-600">None.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-amber-100/85">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
