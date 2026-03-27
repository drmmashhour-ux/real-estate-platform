export function OnboardingWizard({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          Step {step} of {total}: {label}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
