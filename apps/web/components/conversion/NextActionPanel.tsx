import { PrimaryConversionCTA } from "./PrimaryConversionCTA";

export function NextActionPanel({
  title,
  body,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <PrimaryConversionCTA href={ctaHref} label={ctaLabel} event="conversion_track" meta={{ panel: "next_action" }} />
        {secondaryHref && secondaryLabel ? (
          <a href={secondaryHref} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5">
            {secondaryLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
