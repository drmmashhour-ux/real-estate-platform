import Link from "next/link";

/** Shown when FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1 is off — avoids a silent 404 for operators. */
export function PlatformImprovementFeatureDisabled() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h1 className="text-lg font-semibold text-amber-100">Platform improvement — disabled</h1>
        <p className="mt-3 text-sm text-slate-300">
          Platform improvement system is disabled (enable{" "}
          <code className="rounded bg-slate-950 px-1.5 py-0.5 text-xs text-teal-200">
            FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1
          </code>
          ). When the flag is off, bundles are not served and APIs return 404 — by design.
        </p>
        <Link href="/admin/overview" className="mt-4 inline-block text-sm text-amber-400 hover:text-amber-300">
          ← Control tower overview
        </Link>
      </div>
    </main>
  );
}
