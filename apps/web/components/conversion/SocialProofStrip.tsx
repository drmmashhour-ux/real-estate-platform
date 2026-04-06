export function SocialProofStrip({ appearance = "dark" }: { appearance?: "dark" | "light" }) {
  const items = [
    "Broker-ready trust checks",
    "Decision-first analysis",
    "Built for fast action",
    "Transparent confidence labels",
  ];
  const light = appearance === "light";
  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <div
          key={i}
          className={
            light
              ? "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"
              : "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
          }
        >
          {i}
        </div>
      ))}
    </div>
  );
}
