import type { ReactNode } from "react";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubHeroProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function HubHero({ title, subtitle, eyebrow, actions }: HubHeroProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HUB_GOLD_CSS }}>
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-3 max-w-2xl text-sm text-white/70">{subtitle}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
