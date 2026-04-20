export function CertificateOfLocationNextStepsCard(props: { steps: string[] }) {
  const steps = props.steps.slice(0, 5);
  return (
    <div className="rounded-2xl border border-amber-900/25 bg-gradient-to-br from-black to-zinc-950 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/80">Next steps</p>
      {steps.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No additional steps suggested from current signals.</p>
      ) : (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
