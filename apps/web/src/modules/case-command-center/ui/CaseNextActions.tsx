import { memo } from "react";

export const CaseNextActions = memo(function CaseNextActions({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string[];
}) {
  const second = secondary.slice(0, 3);
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#12141a] to-black/40 p-4 ring-1 ring-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Next action</p>
      <p className="mt-2 text-base font-medium leading-snug text-white">{primary}</p>
      {second.length ? (
        <ul className="mt-4 space-y-2 border-t border-white/5 pt-3">
          {second.map((s) => (
            <li key={s} className="flex gap-2 text-xs text-slate-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
