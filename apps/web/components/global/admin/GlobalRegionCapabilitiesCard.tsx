import type { JurisdictionPolicyPack } from "@lecipm/platform-core";

export function GlobalRegionCapabilitiesCard({ packs }: { packs: Record<string, JurisdictionPolicyPack> }) {
  const entries = Object.entries(packs).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">Jurisdiction packs</p>
      <ul className="mt-3 space-y-3">
        {entries.map(([code, pack]) => (
          <li key={code} className="rounded-lg border border-zinc-900 bg-black/40 p-3">
            <p className="font-medium text-amber-100">
              {code} · {pack.legalPackId}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              checklist {pack.checklistEnabled ? "on" : "off"} · trust {pack.trustRulesEnabled ? "on" : "off"} · fraud{" "}
              {pack.fraudRulesEnabled ? "on" : "off"} · rank {pack.rankingRulesEnabled ? "on" : "off"}
            </p>
            <p className="mt-2 text-[11px] text-zinc-600">{pack.notes.slice(0, 3).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
