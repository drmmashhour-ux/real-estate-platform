"use client";

import { RiskHighlightSeverity } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";
import type { RiskHighlight as RiskHighlightType } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

function Icon({ severity }: { severity: RiskHighlightSeverity }) {
  if (severity === RiskHighlightSeverity.Blocker) {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-sm" aria-hidden>
        !
      </span>
    );
  }
  if (severity === RiskHighlightSeverity.Warning) {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm" aria-hidden>
        ⚠
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm" aria-hidden>
      i
    </span>
  );
}

export function RiskHighlightList({ items }: { items: RiskHighlightType[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">Checks</p>
        <p className="mt-1 text-xs text-slate-400">No issues flagged right now.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Checks</p>
      <p className="mt-1 text-xs text-slate-400">Items the platform noticed. Review each line; this is not legal advice.</p>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li key={r.id} className="flex gap-2 rounded-lg border border-white/5 bg-black/30 p-2">
            <Icon severity={r.severity} />
            <div>
              <p className="text-xs font-medium text-slate-200">{r.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{r.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
