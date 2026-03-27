import { UpgradePromptCard } from "./UpgradePromptCard";

export function LockedInsightPreview({
  title,
  previewPoints,
  role,
}: {
  title: string;
  previewPoints: string[];
  role?: "broker" | "investor" | "seller" | "guest";
}) {
  return (
    <section className="rounded-xl border border-dashed border-white/20 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
        {previewPoints.slice(0, 3).map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className="mt-3">
        <UpgradePromptCard role={role} />
      </div>
    </section>
  );
}
