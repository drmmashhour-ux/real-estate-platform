import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import { fetchLiteBookingRows } from "@/lib/lite/lite-queries";
import { LiteBookingsClient } from "@/components/lite/LiteBookingsClient";

export default async function UltraLiteRequestsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations("UltraLite");
  const user = await getSessionUser();
  const initial = user ? await fetchLiteBookingRows(locale, user.id) : [];

  return (
    <div>
      <h1 className="text-base font-bold text-neutral-900">{t("requestsTitle")}</h1>
      <p className="mb-3 text-[12px] text-neutral-700">{t("requestsSubtitle")}</p>
      <LiteBookingsClient initial={initial} locale={locale} authenticated={Boolean(user)} />
    </div>
  );
}
