import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-stone-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-stone-600">{t("description")}</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-[color:var(--color-syria-olive)] hover:underline">
        {t("backHome")}
      </Link>
    </div>
  );
}
