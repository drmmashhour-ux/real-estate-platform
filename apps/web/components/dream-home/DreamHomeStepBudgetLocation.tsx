import type { DreamHomeQuestionnaireInput } from "@/modules/dream-home/types/dream-home.types";

const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/40";

type Props = {
  value: Partial<DreamHomeQuestionnaireInput>;
  onChange: (next: Partial<DreamHomeQuestionnaireInput>) => void;
};

export function DreamHomeStepBudgetLocation({ value: v, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Budget & place</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-300 sm:col-span-2">
          Transaction
          <select
            className={inputCls}
            value={v.transactionType ?? "buy"}
            onChange={(e) => onChange({ transactionType: e.target.value as DreamHomeQuestionnaireInput["transactionType"] })}
          >
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
            <option value="bnb_stay">Short stay</option>
          </select>
        </label>
        <label className="block text-sm text-slate-300 sm:col-span-2">
          City / area label (e.g. montreal, laval, quebec)
          <input
            className={inputCls}
            value={v.city ?? ""}
            onChange={(e) => onChange({ city: e.target.value || null })}
            placeholder="Used for listing search; add what you use"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Radius (km) — optional
          <input
            type="number"
            min={0}
            className={inputCls}
            value={v.radiusKm ?? ""}
            onChange={(e) => onChange({ radiusKm: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
        <label className="block text-sm text-slate-300">
          Min budget
          <input
            type="number"
            min={0}
            className={inputCls}
            value={v.budgetMin ?? ""}
            onChange={(e) => onChange({ budgetMin: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
        <label className="block text-sm text-slate-300">
          Max budget
          <input
            type="number"
            min={0}
            className={inputCls}
            value={v.budgetMax ?? ""}
            onChange={(e) => onChange({ budgetMax: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
        <p className="text-xs text-slate-500 sm:col-span-2">
          Budgets are in your main listing currency. Matching uses your explicit numbers; we don&apos;t infer affordability from
          any personal trait.
        </p>
      </div>
    </div>
  );
}
