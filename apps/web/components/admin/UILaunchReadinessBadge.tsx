import { runUIAudit } from "@/lib/ui/audit";

/**
 * Shown on launch-related admin pages (Order 52.1) — heuristics from `runUIAudit()`.
 */
export async function UILaunchReadinessBadge() {
  const { score } = await runUIAudit().catch(() => ({ score: 0, passed: [], failed: [] }));
  const ready = score >= 80;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        ready
          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
          : "border-amber-500/40 bg-amber-950/30 text-amber-100"
      }`}
    >
      {ready ? "UI Ready" : "Needs polish"} · {score}/100
    </span>
  );
}
