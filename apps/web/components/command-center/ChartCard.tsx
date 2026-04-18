export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card/90 p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-ds-text">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-ds-text-secondary">{subtitle}</p> : null}
      <div className="mt-4 h-56">{children}</div>
    </div>
  );
}
