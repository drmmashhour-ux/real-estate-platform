import type { SyriaEventTimeline } from "@/generated/prisma";

export type EntityTimelineProps = {
  title?: string;
  events: Pick<
    SyriaEventTimeline,
    "id" | "entityType" | "entityId" | "action" | "actorId" | "actorRole" | "metadata" | "createdAt"
  >[];
  emptyLabel?: string;
};

function fmtMeta(meta: unknown): string {
  if (meta == null) return "";
  try {
    const s = JSON.stringify(meta);
    return s.length > 280 ? `${s.slice(0, 280)}…` : s;
  } catch {
    return "";
  }
}

/**
 * Read-only timeline strip — callers load rows via Prisma or GET `/api/admin/timeline`.
 */
export function EntityTimeline({ title = "Event timeline", events, emptyLabel = "No events yet." }: EntityTimelineProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 shadow-sm [dir=rtl]:text-right">
      <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
      {events.length === 0 ? (
        <p className="mt-2 text-xs text-stone-600">{emptyLabel}</p>
      ) : (
        <ol className="mt-3 max-h-80 space-y-2 overflow-y-auto text-xs text-stone-800">
          {events.map((ev) => (
            <li key={ev.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono font-semibold text-amber-900">{ev.action}</span>
                <time
                  className="text-[11px] text-stone-500"
                  dateTime={
                    ev.createdAt instanceof Date ? ev.createdAt.toISOString() : new Date(ev.createdAt as string).toISOString()
                  }
                >
                  {(ev.createdAt instanceof Date ? ev.createdAt : new Date(ev.createdAt as string))
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19)}
                </time>
              </div>
              <p className="mt-1 text-[11px] text-stone-600">
                {ev.actorRole ?? "—"}
                {ev.actorId ? (
                  <>
                    {" · "}
                    <span className="font-mono">{ev.actorId.slice(0, 8)}…</span>
                  </>
                ) : null}
              </p>
              {fmtMeta(ev.metadata) ? (
                <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all text-[10px] text-stone-500">
                  {fmtMeta(ev.metadata)}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
