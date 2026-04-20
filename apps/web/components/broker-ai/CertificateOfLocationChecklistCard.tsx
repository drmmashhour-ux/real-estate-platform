import type { CertificateOfLocationViewModel } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";

export function CertificateOfLocationChecklistCard(props: { viewModel: CertificateOfLocationViewModel }) {
  const rows = props.viewModel.checklistRows;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Checklist</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No checklist rows — context may be unavailable.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.itemId} className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-200">{r.label}</span>
                <span
                  className={`text-[10px] font-semibold uppercase ${r.passed ? "text-emerald-400/90" : "text-amber-400/90"}`}
                >
                  {r.passed ? "passed" : "attention"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
