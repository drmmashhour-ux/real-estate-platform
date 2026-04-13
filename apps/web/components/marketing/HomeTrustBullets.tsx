import { getTranslations } from "next-intl/server";

const KEYS = ["trustSecureBooking", "trustVerifiedListings", "trustSupport"] as const;

/** Three bullets below featured listings — minimal, fast scan. */
export async function HomeTrustBullets() {
  const t = await getTranslations("home");

  return (
    <section
      id="home-trust"
      className="border-t border-white/[0.08] bg-black py-5 md:py-6"
      aria-label={t("trustSectionAria")}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ul className="flex flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-1 md:gap-x-12">
          {KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className="select-none font-medium text-[#D4AF37]" aria-hidden>
                ✔
              </span>
              <span className="text-sm font-medium tracking-tight text-white/88">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
