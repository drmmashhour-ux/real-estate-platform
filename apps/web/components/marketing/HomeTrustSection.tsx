import { getTranslations } from "next-intl/server";

/** Short trust strip — three bullets, minimal scan time. */
export async function HomeTrustSection() {
  const t = await getTranslations("home");
  const bullets: { key: "trustVerified" | "trustPayments" | "trustPricing"; text: string }[] = [
    { key: "trustVerified", text: t("trustVerified") },
    { key: "trustPayments", text: t("trustPayments") },
    { key: "trustPricing", text: t("trustPricing") },
  ];

  return (
    <section id="home-trust" className="bg-black pb-10 pt-2 md:pb-12 md:pt-3" aria-label={t("trustSectionAria")}>
      <div className="mx-auto max-w-4xl border-t border-white/[0.07] px-4 pt-6 sm:px-6 md:pt-7">
        <ul className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-2 md:gap-x-12">
          {bullets.map(({ key, text }) => (
            <li
              key={key}
              className="flex items-center justify-center gap-2 text-xs font-medium text-white/75 sm:justify-start sm:text-sm"
            >
              <span className="shrink-0 select-none text-[#D4AF37]/90" aria-hidden>
                ✔
              </span>
              <span className="text-center sm:text-left">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
