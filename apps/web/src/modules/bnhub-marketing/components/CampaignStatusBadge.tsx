import type { BnhubMarketingCampaignStatus } from "@/types/bnhub-client-models";
import { m } from "./marketing-ui-classes";

const STATUS_STYLES: Record<BnhubMarketingCampaignStatus, string> = {
  DRAFT: "bg-zinc-700 text-zinc-200",
  READY: "bg-sky-900/80 text-sky-200",
  SCHEDULED: "bg-violet-900/70 text-violet-200",
  ACTIVE: "bg-emerald-900/70 text-emerald-200",
  PAUSED: "bg-amber-900/50 text-amber-200",
  COMPLETED: "bg-zinc-800 text-zinc-300",
  ARCHIVED: "bg-zinc-900 text-zinc-500",
  FAILED: "bg-red-950/80 text-red-300",
};

export function CampaignStatusBadge({ status }: { status: BnhubMarketingCampaignStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? m.cardMuted}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
