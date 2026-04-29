import type { BnhubDistributionRowView } from "@/types/bnhub-client-models";
import { ChannelBadge } from "./ChannelBadge";
import { m } from "./marketing-ui-classes";

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "text-emerald-400",
  SCHEDULED: "text-violet-300",
  QUEUED: "text-sky-300",
  DRAFT: "text-zinc-500",
  FAILED: "text-red-400",
  CANCELLED: "text-zinc-600",
};

export function DistributionTimeline({
  rows,
}: {
  rows: BnhubDistributionRowView[];
}) {
  if (rows.length === 0) {
    return (
      <div className={m.cardMuted}>
        <p className={m.subtitle}>No distribution rows yet. Add channels and schedule from the campaign tools.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((d) => (
        <li key={d.id} className={`flex flex-col gap-2 border-l-2 border-amber-500/30 pl-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <ChannelBadge code={d.channel.code} />
            <p className={`mt-1 text-sm font-medium ${STATUS_COLOR[d.distributionStatus] ?? "text-zinc-300"}`}>
              {d.distributionStatus.replace(/_/g, " ")}
            </p>
            {d.scheduledAt ? (
              <p className="text-xs text-zinc-500">Scheduled {new Date(d.scheduledAt).toLocaleString()}</p>
            ) : null}
            {d.publishedAt ? (
              <p className="text-xs text-zinc-500">Published {new Date(d.publishedAt).toLocaleString()}</p>
            ) : null}
            {d.resultSummary ? <p className="mt-1 text-xs text-zinc-400">{d.resultSummary}</p> : null}
          </div>
          <div className="text-right text-xs text-zinc-500">
            {d.impressions > 0 ? <div>Impr. {d.impressions}</div> : null}
            {d.clicks > 0 ? <div>Clicks {d.clicks}</div> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
