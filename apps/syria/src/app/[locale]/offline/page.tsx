import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function OfflinePage(props: Props) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Offline" });

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center [dir=rtl]:text-right">
      <p className="text-lg font-medium text-neutral-900">{t("offlinePageMessage")}</p>
      <p className="mt-3 text-sm text-neutral-600">{t("limitationsBodyShort")}</p>
    </div>
  );
}
