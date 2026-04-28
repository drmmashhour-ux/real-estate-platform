import { headers } from "next/headers";
import { DemoToggle } from "@/src/components/admin/DemoToggle";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { isDemoDataActive } from "@/lib/demo/mode";
import {
  getLecipmDemoRuntimeEnabled,
  isLecipmDemoEffectiveWithoutRequest,
} from "@/src/lib/demo/runtime-flags";

export const dynamic = "force-dynamic";

export default async function AdminDemoControlPage() {
  await requireAdminControlUserId();

  const runtimeOn = getLecipmDemoRuntimeEnabled();
  const headerList = await headers();
  const cookie = headerList.get("cookie") ?? "";
  const effectiveFromRequest = isDemoDataActive(
    new Request("https://lecipm.local/", { headers: { cookie } }),
  );
  const effectiveProcess = isLecipmDemoEffectiveWithoutRequest();
  const effectiveDemoOn = effectiveFromRequest || effectiveProcess;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Demo control center</h1>
        <p className="mt-2 text-sm text-slate-400">
          This page controls <strong className="text-slate-200">this apps/web deployment</strong> demo runtime only.
          Regional stay (Syria) demo lives on its own deployment (<strong>/admin/demo-sybnb</strong> or{" "}
          <strong>/admin/demo-control</strong> there). Operate each toggle on its own origin — no cross-app coupling.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">LECIPM</h2>
        <DemoToggle initialRuntimeEnabled={runtimeOn} effectiveDemoOn={effectiveDemoOn} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
        <h2 className="text-sm font-semibold text-slate-200">Regional stay (Syria)</h2>
        <p className="mt-2">
          Status is not queried from here (separate service). Open Syria admin → <strong>Demo SYBNB</strong> or{" "}
          <strong>Demo control</strong> on that host to toggle{" "}
          <code className="rounded bg-black/40 px-1">INVESTOR_DEMO_MODE_RUNTIME</code>.
        </p>
      </section>
    </div>
  );
}
