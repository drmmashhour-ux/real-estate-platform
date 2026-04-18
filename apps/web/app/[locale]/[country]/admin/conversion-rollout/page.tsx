import Link from "next/link";
import { ConversionRolloutAdminClient } from "@/components/conversion/ConversionRolloutAdminClient";

export default function ConversionRolloutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-300">
          ← Admin home
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Conversion rollout & monitoring</h1>
      <p className="mt-2 text-sm text-slate-400">
        Flags for instant value + conversion UX. Monitoring counters are advisory and{" "}
        <strong className="text-slate-300">in-process only</strong> — see checklist in{" "}
        <code className="rounded bg-slate-900 px-1 text-xs text-slate-400">docs/conversion/conversion-rollout-checklist.md</code>.
      </p>
      <div className="mt-8">
        <ConversionRolloutAdminClient />
      </div>
    </main>
  );
}
