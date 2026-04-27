import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CopyTextBlock } from "@/components/admin/CopyTextBlock";

function publicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SYRIA_APP_URL?.trim() ?? "";
  if (!raw) return "";
  return raw.replace(/\/$/, "");
}

export default async function AdminSupplyGrowthPage() {
  const t = await getTranslations("AdminSupplyGrowth");
  const site = publicSiteUrl();
  const groupText = t("groupPostAr", { link: site || "https://your-hadiah-link.com" });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-800">{t("g2Badge")}</p>
        <h2 className="mt-1 text-lg font-bold text-violet-950">{t("g2Name")}</h2>
        <p className="mt-2 text-sm text-violet-900/85">{t("g2Preamble")}</p>
        <p className="mt-2 text-sm text-violet-900/90">{t("g2Acceptance")}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">{t("badge")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-stone-600">{t("goal")}</p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-medium text-amber-950">{t("principle")}</p>
        {!site ? (
          <p className="mt-2 text-xs text-amber-800/90">
            Tip: set <code className="rounded bg-amber-100 px-1 font-mono">NEXT_PUBLIC_SYRIA_APP_URL</code> so group posts
            get the real link.
          </p>
        ) : null}
      </div>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("ch1Title")}</h2>
        <p className="text-sm text-stone-600">{t("ch1Body")}</p>
        <Link
          href="/quick-post"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800"
        >
          {t("ch1Cta")}
        </Link>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("ch2Title")}</h2>
        <p className="text-sm text-stone-600">{t("ch2Body")}</p>
        <p className="text-xs font-semibold uppercase text-stone-500">{t("outreachArIntro")}</p>
        <CopyTextBlock text={t("outreachDmAr")} copyLabel={t("copy")} copiedLabel={t("copied")} />
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-3">
          <p className="text-xs font-semibold text-sky-900">{t("fastRepliesTitle")}</p>
          <p className="mt-1 text-sm text-sky-950/90">{t("fastRepliesBody")}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("ch3Title")}</h2>
        <p className="text-sm text-stone-600">{t("ch3Body")}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("ch4Title")}</h2>
        <p className="text-sm text-stone-600">{t("ch4Body")}</p>
        <p className="text-xs font-semibold uppercase text-stone-500">{t("groupPostIntro")}</p>
        <CopyTextBlock text={groupText} copyLabel={t("copy")} copiedLabel={t("copied")} />
      </section>

      <section className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
        <h2 className="text-lg font-semibold text-emerald-950">{t("productTitle")}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-emerald-900/90">
          <li>{t("productHome")}</li>
          <li>{t("productPost")}</li>
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-sm font-semibold text-stone-800">{t("loopTitle")}</h2>
        <p className="text-sm text-stone-700">{t("loopBody")}</p>
      </section>

      <section className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
        <h2 className="text-sm font-semibold text-rose-900">{t("ruleTitle")}</h2>
        <p className="text-sm text-rose-950/90">{t("ruleBody")}</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{t("weeklyTitle")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2 pe-4 font-medium">{t("wColDay")}</th>
                <th className="py-2 font-medium">{t("wColAction")}</th>
              </tr>
            </thead>
            <tbody className="text-stone-800">
              <tr className="border-b border-stone-100">
                <td className="py-2 pe-4 font-medium">{t("w1a")}</td>
                <td className="py-2">{t("w1b")}</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pe-4 font-medium">{t("w2a")}</td>
                <td className="py-2">{t("w2b")}</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="py-2 pe-4 font-medium">{t("w3a")}</td>
                <td className="py-2">{t("w3b")}</td>
              </tr>
              <tr>
                <td className="py-2 pe-4 font-medium">{t("w4a")}</td>
                <td className="py-2">{t("w4b")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
        <h2 className="text-sm font-semibold text-amber-950">{t("reportTitle")}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-amber-950/90">
          <li>{t("reportL1")}</li>
          <li>{t("reportL2")}</li>
          <li>{t("reportL3")}</li>
          <li>{t("reportL4")}</li>
        </ul>
      </section>
    </div>
  );
}
