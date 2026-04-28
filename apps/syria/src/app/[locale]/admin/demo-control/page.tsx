import { DemoToggle } from "@/components/admin/DemoToggle";
import { DemoSessionPanel } from "@/components/admin/DemoSessionPanel";
import { getSyriaInvestorDemoRuntimeEnabled } from "@/lib/demo/runtime-flags";
import { getDemoAutoDisabledBanner } from "@/lib/sybnb/demo-safety";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

export default async function SyriaDemoControlPage() {
  const runtimeOn = getSyriaInvestorDemoRuntimeEnabled();
  const effective = isInvestorDemoModeActive();
  const autoBanner = getDemoAutoDisabledBanner();

  return (
    <div className="mx-auto max-w-3xl space-y-6 [dir=rtl]:text-right">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Demo control (Syria)</h1>
        <p className="mt-2 text-sm text-stone-600">
          Syria Darlink demo is toggled here only. The main web marketplace uses a separate deployment and its own
          demo runtime environment — use that app&apos;s admin Demo hub to change it. No shared database flag between
          apps.
        </p>
      </div>

      <DemoToggle
        initialRuntimeEnabled={runtimeOn}
        effectiveDemoOn={effective}
        autoDisabledReason={autoBanner?.reason ?? null}
        autoDisabledAt={autoBanner?.timestamp ?? null}
      />

      <DemoSessionPanel />
    </div>
  );
}
