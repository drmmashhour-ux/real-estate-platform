import { BestPropertyCard } from "@/src/modules/ai-selection-engine/ui/BestPropertyCard";
import { BestLeadCard } from "@/src/modules/ai-selection-engine/ui/BestLeadCard";
import type { LeadSelectionResult, PropertySelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";

export function BestSelectionsPanel({ properties, leads }: { properties: PropertySelectionResult[]; leads: LeadSelectionResult[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">AI Selection Engine</h3>
        <span className="text-xs text-slate-500">Deterministic ranking</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {properties.slice(0, 2).map((item) => (
            <BestPropertyCard key={item.id} selection={item} />
          ))}
        </div>
        <div className="space-y-3">
          {leads.slice(0, 2).map((item) => (
            <BestLeadCard key={item.id} lead={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
