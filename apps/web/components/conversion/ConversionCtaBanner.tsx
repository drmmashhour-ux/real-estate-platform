export function ConversionCtaBanner({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <section className="mt-6 rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
      <p className="text-sm font-semibold text-amber-200">{title}</p>
      <p className="mt-1 text-sm text-slate-200">{subtitle}</p>
      <a
        href={ctaHref}
        className="mt-3 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
      >
        {ctaLabel}
      </a>
    </section>
  );
}
