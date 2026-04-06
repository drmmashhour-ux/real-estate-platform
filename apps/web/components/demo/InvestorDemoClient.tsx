"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DemoStepKey } from "@/src/modules/demo/demoConfig";
import { DEMO_LIVE_PATH_ORDER, DEMO_ROUTES } from "@/src/modules/demo/demoConfig";
import { getDemoStepScript, getNextStep, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export type InvestorDemoClientProps = {
  highlightStep?: DemoStepKey | null;
};

const FLOW: { key: DemoStepKey; label: string; hint: string }[] = [
  { key: "search", label: "Start Search Demo", hint: "Discovery — two paths" },
  { key: "property", label: "Show Property Page", hint: "BNHub + resale CTAs" },
  { key: "contact", label: "Contact / Inquiry Flow", hint: "Lead capture" },
  { key: "booking", label: "BNHub Booking Flow", hint: "Dates → price → checkout preview" },
  { key: "ops", label: "CRM / AI / Close Layer", hint: "Ops proof" },
  { key: "revenue", label: "Revenue / Metrics Layer", hint: "Monetization story" },
];

export function InvestorDemoClient({ highlightStep }: InvestorDemoClientProps) {
  const router = useRouter();
  const step = highlightStep ?? "search";
  const script = getDemoStepScript(step);
  const points = getShortTalkingPoints(step);
  const next = getNextStep(step);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-500/90">Demo run</h2>
        <div className="flex flex-col gap-2">
          {FLOW.map(({ key, label, hint }) => (
            <button
              key={key}
              type="button"
              onClick={() => router.push(DEMO_ROUTES[key])}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                highlightStep === key
                  ? "border-amber-500/50 bg-amber-950/30"
                  : "border-slate-800 bg-slate-900/40 hover:border-amber-900/40 hover:bg-slate-900/60"
              }`}
            >
              <span>
                <span className="block font-medium text-white">{label}</span>
                <span className="text-xs text-slate-500">{hint}</span>
              </span>
              <span className="text-amber-400/70">→</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600">
          Live order: {DEMO_LIVE_PATH_ORDER.join(" → ")}
        </p>
      </div>

      <aside className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/40">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operator notes</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{script}</p>
        <ul className="mt-4 space-y-2 border-t border-slate-800 pt-4">
          {points.map((p) => (
            <li key={p} className="flex gap-2 text-xs text-slate-400">
              <span className="text-amber-500/80">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
          <span className="text-slate-600">Current:</span>{" "}
          <span className="font-medium text-amber-200/90">{step}</span>
          {next ? (
            <>
              <br />
              <span className="text-slate-600">Next:</span>{" "}
              <Link href={DEMO_ROUTES[next]} className="text-amber-400 hover:underline">
                {next}
              </Link>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
