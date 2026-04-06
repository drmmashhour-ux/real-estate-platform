import { BRAND, PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/config/branding";
import { BrandLogo } from "@/components/ui/Logo";

const colorTokens = [
  { label: "Primary gold", value: BRAND.primaryColor, textClass: "text-black" },
  { label: "Background", value: BRAND.background, textClass: "text-white" },
  { label: "Surface", value: BRAND.surface, textClass: "text-white" },
  { label: "Surface light", value: BRAND.surfaceLight, textClass: "text-white" },
] as const;

const rules = [
  "Use the premium black + gold palette for headers, cards, CTAs, and broker identity blocks.",
  "Use the full LECIPM wordmark for flagship brand moments and the icon only when space is tight.",
  "Keep broker identity consistent: name, title, license, office, direct contact, and luxury tone.",
  "Use clean exported assets only. Avoid screenshots of editors or mixed-brand visuals on public pages.",
] as const;

export function BrandGuidelineStrip() {
  return (
    <section className="rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top,#2a2108,transparent_35%),linear-gradient(180deg,#0d0d0d,#111111)] p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">Brand guideline strip</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">One luxury identity across platform, broker, and marketing surfaces</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Use one brand system for all public pages: <span className="text-white">{PLATFORM_NAME}</span> as the flagship
            wordmark and <span className="text-white">{PLATFORM_CARREFOUR_NAME}</span> as the premium descriptor.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <BrandLogo variant="default" href={null} priority />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div>
          <p className="text-sm font-semibold text-white">Core usage rules</p>
          <div className="mt-4 grid gap-3">
            {rules.map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-slate-300">
                {rule}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Approved brand tokens</p>
          <div className="mt-4 grid gap-3">
            {colorTokens.map((token) => (
              <div key={token.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="h-10 w-10 rounded-xl border border-white/10" style={{ backgroundColor: token.value }} />
                <div>
                  <p className="text-sm font-medium text-white">{token.label}</p>
                  <p className="text-xs text-slate-400">{token.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
