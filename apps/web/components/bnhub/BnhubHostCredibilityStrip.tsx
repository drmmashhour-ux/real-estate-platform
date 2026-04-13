import { Clock, Star, Zap } from "lucide-react";

function shortResponseLabel(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return "Usually within 24 hours";
  }
  if (minutes < 60) {
    return `Within ${Math.max(1, Math.round(minutes))} min`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    const h = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
    return `Within ${h} hour${h === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `Within ${days} day${days === 1 ? "" : "s"}`;
}

type RatingSource = "reviews" | "host_quality" | "none";

export function BnhubHostCredibilityStrip({
  displayRating,
  ratingSource,
  reviewCount,
  avgResponseMinutes,
}: {
  displayRating: number | null;
  ratingSource: RatingSource;
  reviewCount: number;
  avgResponseMinutes: number | null;
}) {
  const responseText = shortResponseLabel(avgResponseMinutes);
  const fastResponse =
    avgResponseMinutes != null && Number.isFinite(avgResponseMinutes) && avgResponseMinutes > 0 && avgResponseMinutes <= 120;
  const ResponseIcon = fastResponse ? Zap : Clock;

  return (
    <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg bg-slate-500/[0.08] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Star
          className={`h-4 w-4 shrink-0 ${ratingSource === "none" ? "text-slate-300" : "fill-amber-400 text-amber-400"}`}
          strokeWidth={ratingSource === "none" ? 1.5 : 0}
          aria-hidden
        />
        {ratingSource === "reviews" && displayRating != null ? (
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">{displayRating}</span>
            <span className="text-slate-600">
              {" "}
              ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
            </span>
          </p>
        ) : ratingSource === "host_quality" && displayRating != null ? (
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">{displayRating}</span>
            <span className="text-slate-500"> · Host quality score</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500">No guest reviews yet</p>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        <ResponseIcon className="h-4 w-4 shrink-0 text-sky-600" strokeWidth={2} aria-hidden />
        <div className="min-w-0 text-right sm:text-left">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:inline sm:mr-1.5">
            Response time
          </span>
          <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-sm font-medium text-sky-900 ring-1 ring-sky-100/80">
            {responseText}
          </span>
        </div>
      </div>
    </div>
  );
}
