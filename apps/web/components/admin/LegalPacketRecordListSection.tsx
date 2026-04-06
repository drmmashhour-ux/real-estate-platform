import type { ReactNode } from "react";

type RecordItem = {
  id: string;
  badges?: ReactNode[];
  title?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  extra?: ReactNode;
};

type Props = {
  heading: string;
  emptyText: string;
  items: RecordItem[];
};

export function LegalPacketRecordListSection({
  heading,
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
              {item.title ? <div className="mt-2 text-sm text-slate-100">{item.title}</div> : null}
              {item.body ? <div className="mt-2 text-sm text-slate-300">{item.body}</div> : null}
              {item.footer ? <div className="mt-2 text-xs text-slate-500">{item.footer}</div> : null}
              {item.extra ? <div className="mt-2">{item.extra}</div> : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
