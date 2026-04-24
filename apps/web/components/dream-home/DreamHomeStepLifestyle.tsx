import type { DreamHomeQuestionnaireInput } from "@/modules/dream-home/types/dream-home.types";

const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/40";

type Props = {
  value: Partial<DreamHomeQuestionnaireInput>;
  onChange: (next: Partial<DreamHomeQuestionnaireInput>) => void;
};

export function DreamHomeStepLifestyle({ value: v, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Lifestyle & priorities</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-300 sm:col-span-2">
          Work from home
          <select
            className={inputCls}
            value={v.workFromHome ?? "none"}
            onChange={(e) =>
              onChange({ workFromHome: e.target.value as DreamHomeQuestionnaireInput["workFromHome"] })
            }
          >
            <option value="none">Not usually</option>
            <option value="sometimes">Sometimes</option>
            <option value="full_time">Full time</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Privacy
          <select
            className={inputCls}
            value={v.privacyPreference ?? "medium"}
            onChange={(e) => onChange({ privacyPreference: e.target.value as "low" | "medium" | "high" })}
          >
            <option value="low">Low / open</option>
            <option value="medium">Balanced</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Hosting
          <select
            className={inputCls}
            value={v.hostingPreference ?? "medium"}
            onChange={(e) => onChange({ hostingPreference: e.target.value as "low" | "medium" | "high" })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Kitchen
          <select
            className={inputCls}
            value={v.kitchenPriority ?? "medium"}
            onChange={(e) => onChange({ kitchenPriority: e.target.value as "low" | "medium" | "high" })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Outdoor
          <select
            className={inputCls}
            value={v.outdoorPriority ?? "medium"}
            onChange={(e) => onChange({ outdoorPriority: e.target.value as "low" | "medium" | "high" })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Commute priority
          <select
            className={inputCls}
            value={v.commutePriority ?? "medium"}
            onChange={(e) => onChange({ commutePriority: e.target.value as "low" | "medium" | "high" })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300">
          Noise (quiet = prefer quieter areas)
          <select
            className={inputCls}
            value={v.noiseTolerance ?? "medium"}
            onChange={(e) => onChange({ noiseTolerance: e.target.value as "low" | "medium" | "high" })}
          >
            <option value="low">Lively OK</option>
            <option value="medium">Balanced</option>
            <option value="high">Prefer quiet</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
          <input type="checkbox" checked={!!v.pets} onChange={(e) => onChange({ pets: e.target.checked || undefined })} />
          Pets
        </label>
        <label className="block text-sm text-slate-300 sm:col-span-2">
          Accessibility (comma or line-separated, optional)
          <textarea
            className={inputCls + " min-h-[64px]"}
            value={Array.isArray(v.accessibilityNeeds) ? v.accessibilityNeeds.join(", ") : v.accessibilityNeeds || ""}
            onChange={(e) =>
              onChange({
                accessibilityNeeds: e.target.value
                  .split(/[,\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 12),
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
