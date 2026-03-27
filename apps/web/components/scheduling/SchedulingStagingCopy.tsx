export function SchedulingLegalCopy() {
  return (
    <p className="text-xs text-slate-500">
      Appointment requests are subject to broker confirmation and availability.
    </p>
  );
}

export function SchedulingDemoDisclaimer() {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") return null;
  return (
    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
      This is a demo scheduling workflow. No real-world appointment is created outside your test environment.
    </p>
  );
}
