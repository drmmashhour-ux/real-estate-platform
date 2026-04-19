import { GrowthEngineV2Panel } from "@/components/growth/GrowthEngineV2Panel";
import { growthEngineV2Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGrowthEngineV2Page() {
  const show = growthEngineV2Flags.growthEngineV2 && growthEngineV2Flags.growthEngineV2Panel;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Growth Engine V2</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Unified internal snapshot across traffic, conversion, revenue, BNHub, and broker execution — advisory only.
          Requires <code className="text-slate-300">FEATURE_GROWTH_ENGINE_V2</code> for API and{" "}
          <code className="text-slate-300">FEATURE_GROWTH_ENGINE_V2_PANEL</code> to render this UI.
        </p>
      </header>
      <div className="mt-8">
        {show ? (
          <GrowthEngineV2Panel />
        ) : (
          <p className="text-sm text-slate-500">
            Enable FEATURE_GROWTH_ENGINE_V2 and FEATURE_GROWTH_ENGINE_V2_PANEL for this operating view.
          </p>
        )}
      </div>
    </div>
  );
}
