import Link from "next/link";
import { ActivationPrompt } from "@/src/modules/growth-funnel/ui/ActivationPrompt";
import { FirstValueFlow } from "@/src/modules/growth-funnel/ui/FirstValueFlow";
import { ReferralPanel } from "@/src/modules/growth-funnel/ui/ReferralPanel";

export const dynamic = "force-dynamic";

export default function FirstValuePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            ← Home
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Growth funnel — first value</h1>
          <p className="mt-2 text-slate-400">
            Structured path from traffic to activation: simulate once, see risk and next steps, then continue in product.
          </p>
        </div>
        <FirstValueFlow />
        <ActivationPrompt />
        <ReferralPanel />
      </div>
    </div>
  );
}
