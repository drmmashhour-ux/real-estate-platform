/**
 * Zero-deps SVG bar chart (server-friendly). Keep heights proportional to max value.
 */
export function AdminStatsBarChart({
  title,
  points,
  valueLabel,
}: {
  title: string;
  points: { label: string; value: number }[];
  valueLabel: string;
}) {
  const w = 640;
  const h = 200;
  const pad = 36;
  const max = Math.max(1, ...points.map((p) => p.value));
  const barW = (w - pad * 2) / points.length - 4;
  const chartH = h - pad - 20;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      <p className="text-xs text-stone-500">{valueLabel}</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full max-w-3xl text-stone-700"
        role="img"
        aria-label={title}
      >
        {points.map((p, i) => {
          const x = pad + i * (barW + 4);
          const bh = (p.value / max) * chartH;
          const y = pad + (chartH - bh);
          return (
            <g key={p.label + i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(1, bh)}
                className="fill-amber-500/90"
                rx={3}
              />
              <text
                x={x + barW / 2}
                y={h - 4}
                textAnchor="middle"
                className="fill-stone-500"
                style={{ fontSize: 9 }}
              >
                {p.label}
              </text>
            </g>
          );
        })}
        <line x1={pad} y1={pad + chartH} x2={w - pad} y2={pad + chartH} className="stroke-stone-200" strokeWidth={1} />
      </svg>
    </div>
  );
}
