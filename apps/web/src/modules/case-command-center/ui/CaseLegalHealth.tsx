import { memo } from "react";
import type { CaseHealthBlockerItem } from "@/src/modules/case-command-center/domain/case.types";

function ItemRow({ item, variant }: { item: CaseHealthBlockerItem; variant: "blocker" | "warning" }) {
  const href = item.sectionKey ? `#section-${item.sectionKey}` : undefined;
  const content = (
    <span className={variant === "blocker" ? "text-rose-100/95" : "text-amber-100/90"}>{item.label}</span>
  );
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${variant === "blocker" ? "bg-rose-400" : "bg-amber-400/90"}`} />
      <div className="min-w-0 flex-1">
        {href ? (
          <a href={href} className="block hover:underline">
            {content}
          </a>
        ) : (
          content
        )}
        {item.sectionKey ? (
          <p className="mt-0.5 text-[10px] text-slate-600">Section: {item.sectionKey}</p>
        ) : null}
      </div>
    </li>
  );
}

export const CaseLegalHealth = memo(function CaseLegalHealth({
  blockers,
  warnings,
}: {
  blockers: CaseHealthBlockerItem[];
  warnings: CaseHealthBlockerItem[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-200/90">Blockers</p>
        <p className="mt-0.5 text-[10px] text-rose-200/50">Must clear before the file is safe to advance.</p>
        {blockers.length ? (
          <ul className="mt-2 space-y-2">{blockers.map((b) => <ItemRow key={b.id} item={b} variant="blocker" />)}</ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No critical blockers.</p>
        )}
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Warnings</p>
        <p className="mt-0.5 text-[10px] text-amber-200/50">Non-blocking — review when convenient.</p>
        {warnings.length ? (
          <ul className="mt-2 space-y-2">{warnings.map((w) => <ItemRow key={w.id} item={w} variant="warning" />)}</ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500">No warnings.</p>
        )}
      </div>
    </div>
  );
});
