import type { DreamHomeQuestionnaireInput } from "@/modules/dream-home/types/dream-home.types";

const inputCls =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/40";

type Props = {
  value: Partial<DreamHomeQuestionnaireInput>;
  onChange: (next: Partial<DreamHomeQuestionnaireInput>) => void;
};

const SPACE = [
  { id: "home_office", label: "Home office" },
  { id: "prayer", label: "Prayer / meditation" },
  { id: "gym", label: "Gym / training" },
  { id: "playroom", label: "Playroom" },
  { id: "guest_suite", label: "Guest suite" },
];

function toggle(id: string, list: string[] = []) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function DreamHomeStepPreferences({ value: v, onChange }: Props) {
  const sp = v.specialSpaces ?? [];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Style & must-haves</h2>
      <label className="block text-sm text-slate-300">
        Style (comma separated)
        <input
          className={inputCls}
          value={(v.stylePreferences ?? []).join(", ")}
          onChange={(e) =>
            onChange({
              stylePreferences: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 20),
            })
          }
        />
      </label>
      <div>
        <p className="text-sm text-slate-300">Special spaces (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPACE.map((s) => {
            const on = sp.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ specialSpaces: toggle(s.id, sp) })}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-medium " +
                  (on ? "border-premium-gold bg-premium-gold/15 text-white" : "border-white/15 text-slate-300")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="block text-sm text-slate-300">
        Must-haves (one per line)
        <textarea
          className={inputCls + " min-h-[56px]"}
          value={(v.mustHaves ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              mustHaves: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 20),
            })
          }
        />
      </label>
      <label className="block text-sm text-slate-300">
        Deal-breakers (one per line)
        <textarea
          className={inputCls + " min-h-[56px]"}
          value={(v.dealBreakers ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              dealBreakers: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 20),
            })
          }
        />
      </label>
      <label className="block text-sm text-slate-300">
        Lifestyle tags (comma separated, optional)
        <input
          className={inputCls}
          value={(v.lifestyleTags ?? []).join(", ")}
          onChange={(e) =>
            onChange({
              lifestyleTags: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 24),
            })
          }
        />
      </label>
    </div>
  );
}
