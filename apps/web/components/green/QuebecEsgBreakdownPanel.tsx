import type { GreenListingMetadata } from "@/modules/green/green.types";

type Snapshot = NonNullable<GreenListingMetadata["quebecEsgSnapshot"]>;

const ORDER = [
  "heating",
  "insulation",
  "windows",
  "energyEfficiency",
  "materials",
  "water",
  "bonus",
] as const;

const LABELS: Record<(typeof ORDER)[number], string> = {
  heating: "Heating system",
  insulation: "Insulation (attic & walls)",
  windows: "Windows & glazing",
  energyEfficiency: "Energy efficiency",
  materials: "Materials",
  water: "Water efficiency",
  bonus: "Green roof / renewables",
};

/** Per-factor scores (0–100) + improvement areas — Québec-inspired methodology */
export function QuebecEsgBreakdownPanel({ snapshot }: { snapshot: Snapshot }) {
  const bd = snapshot.breakdown as Partial<Record<(typeof ORDER)[number], number>>;

  return (
    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-black/40 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
        Québec-inspired factor scores
      </p>
      <ul className="mt-2 space-y-1.5">
        {ORDER.map((key) => {
          const v = bd[key];
          return (
            <li key={key} className="flex items-center justify-between gap-3 text-xs text-slate-300">
              <span className="text-slate-400">{LABELS[key]}</span>
              <span className="tabular-nums font-medium text-emerald-100/95">{v != null ? `${v}/100` : "—"}</span>
            </li>
          );
        })}
      </ul>
      {(snapshot.improvementAreas ?? []).length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-400/90">Improvement areas</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-400">
            {(snapshot.improvementAreas ?? []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{snapshot.disclaimer}</p>
    </div>
  );
}
