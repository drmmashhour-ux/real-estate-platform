import { getTranslations } from "next-intl/server";

export async function SybnbHomeTrustStrip() {
  const t = await getTranslations("Sybnb.trust");

  const items = [
    { key: "phone" as const, icon: "✓" },
    { key: "review" as const, icon: "✓" },
    { key: "manual" as const, icon: "✓" },
    { key: "syria" as const, icon: "✓" },
  ];

  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 px-4 py-8 sm:px-8">
      <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{t("title")}</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <li
            key={it.key}
            className="flex items-start gap-3 rounded-2xl border border-neutral-200/60 bg-white px-4 py-3 shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm text-amber-400" aria-hidden>
              {it.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{t(`${it.key}Title`)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{t(`${it.key}Body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
