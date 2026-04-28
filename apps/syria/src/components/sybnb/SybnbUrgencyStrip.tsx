import { getTranslations } from "next-intl/server";

type Props = { liveCount: number; emphasisStrong?: boolean };

export async function SybnbUrgencyStrip({ liveCount, emphasisStrong }: Props) {
  const t = await getTranslations("Sybnb.home");
  const elevated = emphasisStrong === true;

  return (
    <div
      className={
        elevated
          ? "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100/70 px-4 py-3.5 text-center shadow-md ring-2 ring-amber-300/50 sm:flex-row sm:gap-3"
          : "flex flex-col items-center justify-center gap-1 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/90 to-amber-100/50 px-4 py-3 text-center sm:flex-row sm:gap-3"
      }
    >
      <span className={elevated ? "text-xl" : "text-lg"} aria-hidden>
        ⏱
      </span>
      <div className="space-y-0.5">
        <p className={elevated ? "text-base font-semibold text-amber-950" : "text-sm font-medium text-amber-950"}>
          {t("urgency", { count: liveCount })}
        </p>
        {elevated ? (
          <p className="text-xs font-medium text-amber-900/90">{t("urgencySoftLaunch")}</p>
        ) : null}
      </div>
    </div>
  );
}
