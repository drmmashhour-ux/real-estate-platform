import { getTranslations } from "next-intl/server";

type Props = { liveCount: number };

export async function SybnbUrgencyStrip({ liveCount }: Props) {
  const t = await getTranslations("Sybnb.home");

  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/90 to-amber-100/50 px-4 py-3 text-center sm:flex-row sm:gap-3">
      <span className="text-lg" aria-hidden>
        ⏱
      </span>
      <p className="text-sm font-medium text-amber-950">
        {t("urgency", { count: liveCount })}
      </p>
    </div>
  );
}
