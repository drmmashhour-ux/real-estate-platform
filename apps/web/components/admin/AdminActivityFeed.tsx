import Link from "next/link";
import type { ActivityFeedItem } from "@/modules/analytics/types";

type Props = { items: ActivityFeedItem[] };

export function AdminActivityFeed({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-[#737373]">No recent activity.</p>;
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {items.map((it, i) => (
        <li
          key={`${it.timestamp}-${i}`}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">
              {it.type.replace(/_/g, " ")}
            </span>
            <time className="text-[11px] text-[#737373]" dateTime={it.timestamp}>
              {new Date(it.timestamp).toLocaleString()}
            </time>
          </div>
          <p className="mt-1 text-[#B3B3B3]">{it.message}</p>
          {it.link ? (
            <Link href={it.link} className="mt-1 inline-block text-xs text-amber-400 hover:underline">
              Open
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
