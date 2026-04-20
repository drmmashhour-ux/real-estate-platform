import type { LegalHubHeroModel } from "@/modules/legal/legal-view-model.service";

export function LegalHubHero({ hero }: { hero: LegalHubHeroModel }) {
  return (
    <header className="rounded-2xl border border-premium-gold/30 bg-gradient-to-br from-black via-[#101010] to-[#0a0a0a] px-6 py-8 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-premium-gold">Legal hub</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{hero.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#B3B3B3]">{hero.subtitle}</p>
      <dl className="mt-6 flex flex-col gap-2 text-xs text-[#9CA3AF] sm:flex-row sm:items-center sm:gap-8">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-premium-gold/90">Workspace</dt>
          <dd className="mt-1 text-white/90">{hero.actorLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-premium-gold/90">Overview</dt>
          <dd className="mt-1">{hero.portfolioLine}</dd>
        </div>
      </dl>
    </header>
  );
}
