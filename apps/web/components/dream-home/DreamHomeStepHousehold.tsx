import type { DreamHomeQuestionnaireInput } from "@/modules/dream-home/types/dream-home.types";

const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/40";

type Props = {
  value: Partial<DreamHomeQuestionnaireInput>;
  onChange: (next: Partial<DreamHomeQuestionnaireInput>) => void;
};

export function DreamHomeStepHousehold({ value: v, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Household & guests</h2>
      <p className="text-xs text-slate-500">We only use what you enter here—never inferred from background.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-300">
          Family size
          <input
            type="number"
            min={1}
            max={20}
            className={inputCls}
            value={v.familySize ?? ""}
            onChange={(e) => onChange({ familySize: Number(e.target.value) || undefined })}
          />
        </label>
        <label className="block text-sm text-slate-300">
          Adults
          <input
            type="number"
            min={1}
            className={inputCls}
            value={v.adultsCount ?? ""}
            onChange={(e) => onChange({ adultsCount: Number(e.target.value) || undefined })}
          />
        </label>
        <label className="block text-sm text-slate-300">
          Children
          <input
            type="number"
            min={0}
            className={inputCls}
            value={v.childrenCount ?? ""}
            onChange={(e) => onChange({ childrenCount: Number(e.target.value) || undefined })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={!!v.eldersInHome}
            onChange={(e) => onChange({ eldersInHome: e.target.checked || undefined })}
          />
          Elders / extended family in the home
        </label>
        <label className="block text-sm text-slate-300 sm:col-span-2">
          Guest frequency
          <select
            className={inputCls}
            value={v.guestsFrequency ?? "medium"}
            onChange={(e) =>
              onChange({ guestsFrequency: e.target.value as DreamHomeQuestionnaireInput["guestsFrequency"] })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
    </div>
  );
}
