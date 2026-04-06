"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DEMO_LIVE_STEP_COUNT,
  getLiveDemoStepIndex,
  getNextLiveDemoPath,
  getPrevLiveDemoPath,
} from "@/src/modules/demo/demoConfig";

export function DemoLinearFooter() {
  const pathname = usePathname() ?? "";
  const step = getLiveDemoStepIndex(pathname);
  const next = getNextLiveDemoPath(pathname);
  const prev = getPrevLiveDemoPath(pathname);

  if (step === 0) return null;

  return (
    <footer className="border-t border-slate-800/80 bg-black/50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          {prev ? (
            <Link
              href={prev}
              className="text-sm font-medium text-slate-400 hover:text-amber-200/90"
            >
              ← Previous
            </Link>
          ) : (
            <span className="text-sm text-slate-600">Start</span>
          )}
        </div>
        <p className="text-center text-xs text-slate-500">
          Live order: step <span className="font-semibold text-amber-200/90">{step}</span> / {DEMO_LIVE_STEP_COUNT}
        </p>
        <div>
          {next ? (
            <Link
              href={next}
              className="text-sm font-semibold text-amber-400 hover:text-amber-300"
            >
              Continue →
            </Link>
          ) : (
            <span className="text-sm text-emerald-400/80">End of demo</span>
          )}
        </div>
      </div>
    </footer>
  );
}
