import { headers } from "next/headers";
import { DemoToggle } from "@/src/components/admin/DemoToggle";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { isDemoDataActive } from "@/lib/demo/mode";
import {
  getLecipmDemoRuntimeEnabled,
  isLecipmDemoEffectiveWithoutRequest,
} from "@/src/lib/demo/runtime-flags";

export const dynamic = "force-dynamic";

export default async function AdminDemoLecipmPage() {
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold text-white">LECIPM demo</h1>
        <p className="mt-2 text-sm text-slate-400">
          Toggle applies only to this apps/web deployment. Regional stay (Syria) uses{" "}
          <code className="rounded bg-black/40 px-1">INVESTOR_DEMO_MODE_RUNTIME</code> on the Syria host (
          <strong>/admin/demo-sybnb</strong>). No shared DB flag between apps.
        </p>
      </div>

      <DemoToggle initialRuntimeEnabled={runtimeOn} effectiveDemoOn={effectiveDemoOn} />
    </div>
  );
}
