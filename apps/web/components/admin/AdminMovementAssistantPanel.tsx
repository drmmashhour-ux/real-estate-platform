import Link from "next/link";

type MovementEvent = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  sourceModule: string | null;
  createdAt: string;
};

type SummaryCard = {
  title: string;
  value: number;
  hint: string;
};

type Props = {
  last24h: SummaryCard[];
  priorityFeed: Array<{
    title: string;
    detail: string;
    at: string;
    href?: string;
    linkLabel?: string;
  }>;
  aiSummary: string[];
  lanes: Array<{
    title: string;
    summary: string;
    actionHref?: string;
    actionLabel?: string;
    items: Array<{
      title: string;
      detail: string;
      at: string;
      href?: string;
      linkLabel?: string;
    }>;
  }>;
};

export function AdminMovementAssistantPanel({ last24h, priorityFeed, aiSummary, lanes }: Props) {
  return (
    <section className="rounded-2xl border border-violet-500/25 bg-violet-950/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
            AI movement assistant
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Platform movement monitor</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            AI-style operational summary of recent listing, contract, payment, deal, and trust movements across the
            platform.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {last24h.map((item) => (
          <div key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.title}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-xs text-slate-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">AI brief</p>
          <div className="mt-3 space-y-3">
            {aiSummary.map((line) => (
              <p key={line} className="text-sm text-slate-300">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Priority feed</p>
          <div className="mt-3 space-y-3">
            {priorityFeed.length === 0 ? (
              <p className="text-sm text-slate-500">No recent platform movements captured.</p>
            ) : (
              priorityFeed.map((item) => (
                <div key={`${item.title}-${item.at}`} className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                  {item.href && item.linkLabel ? (
                    <Link href={item.href} className="mt-2 inline-block text-[11px] font-medium text-premium-gold hover:underline">
                      {item.linkLabel}
                    </Link>
                  ) : null}
                  <p className="mt-2 text-[11px] text-slate-500">{item.at}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {lanes.map((lane) => (
          <div key={lane.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-white">{lane.title}</p>
              {lane.actionHref && lane.actionLabel ? (
                <Link href={lane.actionHref} className="text-xs font-medium text-premium-gold hover:underline">
                  {lane.actionLabel}
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-400">{lane.summary}</p>
            <div className="mt-3 space-y-3">
              {lane.items.length === 0 ? (
                <p className="text-sm text-slate-500">No recent movement in this lane.</p>
              ) : (
                lane.items.map((item) => (
                  <div key={`${item.title}-${item.at}`} className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                    {item.href && item.linkLabel ? (
                      <Link href={item.href} className="mt-2 inline-block text-[11px] font-medium text-premium-gold hover:underline">
                        {item.linkLabel}
                      </Link>
                    ) : null}
                    <p className="mt-2 text-[11px] text-slate-500">{item.at}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
