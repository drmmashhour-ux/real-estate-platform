import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSybnbBrandSocialUrls } from "@/lib/sybnb/sybnb-social-proof";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sybnb.brand");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SybnbBrandPage() {
  const t = await getTranslations("Sybnb.brand");
  const { facebook, instagram } = getSybnbBrandSocialUrls();

  const playbook = [t("playbook1"), t("playbook2"), t("playbook3")];
  const trust = [t("trust1"), t("trust2"), t("trust3")];

  return (
    <div className="space-y-12 pb-8 [dir=rtl]:text-right">
      <header className="space-y-3 rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black px-6 py-10 text-white shadow-xl sm:px-10">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-black tracking-tight text-neutral-900 shadow-lg"
            aria-hidden
          >
            S
          </span>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-400/90">{t("kicker")}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          </div>
        </div>
        <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-neutral-300">{t("subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">{t("socialPagesTitle")}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t("socialPagesLead")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {facebook ? (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1877F2] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              {t("facebookCta")}
            </a>
          ) : (
            <p className="rounded-xl border border-dashed border-amber-300 bg-white px-4 py-3 text-xs text-amber-950/80">{t("facebookUnset")}</p>
          )}
          {instagram ? (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              {t("instagramCta")}
            </a>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">{t("instagramOptional")}</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">{t("contentTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-neutral-700">
            {playbook.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-950">{t("trustTitle")}</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-emerald-950/95">
            {trust.map((line) => (
              <li key={line.slice(0, 40)} className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 shadow-inner">
        <h2 className="text-lg font-semibold text-neutral-900">{t("proofTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t("proofBody")}</p>
      </section>

      <p className="text-center">
        <Link href="/sybnb" className="text-sm font-semibold text-amber-900 underline-offset-2 hover:underline">
          {t("backSybnb")}
        </Link>
      </p>
    </div>
  );
}
