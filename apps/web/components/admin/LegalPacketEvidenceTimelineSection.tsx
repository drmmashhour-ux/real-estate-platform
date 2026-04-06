import type { ReactNode } from "react";

type EvidenceItem = {
  id: string;
  badges?: ReactNode[];
  timestamp?: ReactNode;
  body: ReactNode;
  annotation?: {
    label: string;
    body: ReactNode;
  } | null;
  footer?: ReactNode;
};

type Props = {
  heading?: string;
  emptyText: string;
  items: EvidenceItem[];
};

export function LegalPacketEvidenceTimelineSection({
  heading = "Evidence Timeline",
  emptyText,
  items,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold text-white">{heading}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              {item.badges?.length ? <div className="flex flex-wrap items-center gap-2">{item.badges}</div> : null}
              {item.timestamp ? <p className="mt-2 text-xs text-slate-500">{item.timestamp}</p> : null}
              <div className="mt-2 text-sm text-slate-200">{item.body}</div>
              {item.annotation ? (
                <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">{item.annotation.label}</p>
                  <div className="mt-1 text-sm text-amber-100">{item.annotation.body}</div>
                </div>
              ) : null}
              {item.footer ? <div className="mt-2 text-xs text-slate-500">{item.footer}</div> : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
