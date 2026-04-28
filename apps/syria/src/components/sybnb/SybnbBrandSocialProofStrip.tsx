import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSybnbBrandSocialProof } from "@/lib/sybnb/sybnb-social-proof";

export async function SybnbBrandSocialProofStrip() {
  const [proof, t, locale] = await Promise.all([
    getSybnbBrandSocialProof(),
    getTranslations("Sybnb.home"),
    getLocale(),
  ]);

  const fmt = (n: number) =>
    n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US");

  const cells = [
    { label: t("brandStripListings"), value: fmt(proof.listings) },
    { label: t("brandStripActivity"), value: fmt(proof.activity7d) },
    { label: t("brandStripConversations"), value: fmt(proof.conversations7d) },
  ];

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-6 shadow-sm sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="text-center sm:text-start [dir=rtl]:sm:text-end">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{t("brandStripTitle")}</h2>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-neutral-600">{t("brandStripFootnote")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {cells.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-3 text-center shadow-inner sm:min-w-[112px]"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{c.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900">{c.value}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-neutral-500 sm:text-start [dir=rtl]:sm:text-end">
        <Link href="/sybnb/brand" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
          {t("brandPresenceLink")}
        </Link>
      </p>
    </section>
  );
}
