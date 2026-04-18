import { Link } from "@/i18n/navigation";
import type { RecommendationBlock } from "@/src/modules/recommendations/recommendation.types";

export function RecommendationSection({ block }: { block: RecommendationBlock }) {
  if (block.items.length === 0) return null;
  return (
    <section className="mt-14 scroll-mt-8 border-t border-ds-border/80 pt-12">
      <header className="mb-8 max-w-3xl space-y-2">
        <h3 className="font-[family-name:var(--font-serif)] text-xl font-semibold tracking-tight text-ds-text md:text-2xl">
          {block.title}
        </h3>
        {block.subtitle ? (
          <p className="text-sm leading-relaxed text-ds-text-secondary">{block.subtitle}</p>
        ) : null}
        {block.explanation ? (
          <p className="text-[11px] leading-relaxed text-ds-text-secondary/90">{block.explanation}</p>
        ) : null}
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {block.items.map((it) => (
          <Link
            key={`${it.kind}-${it.id}`}
            href={it.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-ds-border bg-ds-card shadow-ds-soft transition duration-200 hover:border-ds-gold/35 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.12)]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-ds-surface">
              {it.coverImage ?
                // eslint-disable-next-line @next/next/no-img-element -- external FSBO URLs; lazy for feed perf
                <img
                  src={it.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:brightness-105"
                />
              : null}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-ds-text group-hover:text-ds-gold">
                {it.title}
              </p>
              <p className="mt-1.5 text-xs text-ds-text-secondary">{it.city}</p>
              <p className="mt-auto pt-3 text-base font-semibold tabular-nums text-ds-gold">{it.priceLabel}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
