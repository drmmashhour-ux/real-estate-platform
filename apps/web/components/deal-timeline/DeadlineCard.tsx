"use client";

export function DeadlineCard({ label, iso }: { label: string; iso: string }) {
  const d = new Date(iso);
  const overdue = d.getTime() < Date.now();
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        overdue ? "border-amber-500/40 bg-amber-950/20 text-amber-100" : "border-white/10 bg-black/30 text-ds-text"
      }`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-xs opacity-80">{d.toLocaleString()}</p>
    </div>
  );
}
