"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getNextLiveDemoPath,
  getPrevLiveDemoPath,
  pathToDemoStep,
  type DemoStepKey,
} from "@/src/modules/demo/demoConfig";

/** Exact live order: /demo → search → property → contact → booking → ops → metrics */
const LINKS: { href: string; label: string; step: DemoStepKey | null }[] = [
  { href: "/demo", label: "Demo", step: null },
  { href: "/demo/search", label: "Search", step: "search" },
  { href: "/demo/property/bnhub", label: "Property", step: "property" },
  { href: "/demo/contact", label: "Contact", step: "contact" },
  { href: "/demo/booking", label: "Booking", step: "booking" },
  { href: "/demo/ops", label: "Ops", step: "ops" },
  { href: "/demo/metrics", label: "Metrics", step: "revenue" },
];

export function DemoNav() {
  const pathname = usePathname() ?? "";
  const current = pathToDemoStep(pathname);
  const onHub = pathname.replace(/\/$/, "") === "/demo";
  const nextHref = getNextLiveDemoPath(pathname);
  const prevHref = getPrevLiveDemoPath(pathname);

  return (
    <nav className="border-b border-amber-900/30 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-1">
          {LINKS.map(({ href, label, step }) => {
            const active = step === null ? onHub : current === step;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  active
                    ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-amber-100/90"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5 text-right text-[10px] text-slate-500 sm:text-xs">
          {onHub ? (
            <span className="text-slate-600">Command center · step 1 / 7</span>
          ) : current ? (
            <>
              <span>
                <span className="text-slate-600">Step:</span>{" "}
                <span className="font-medium text-amber-200/90">{current}</span>
              </span>
              <span>
                {prevHref ? (
                  <>
                    <span className="text-slate-600">Prev:</span>{" "}
                    <Link href={prevHref} className="text-amber-400/80 hover:underline">
                      {prevHref.replace("/demo", "") || "/"}
                    </Link>
                    {" · "}
                  </>
                ) : null}
                {nextHref ? (
                  <>
                    <span className="text-slate-600">Next:</span>{" "}
                    <Link href={nextHref} className="text-amber-400/80 hover:underline">
                      {nextHref.replace("/demo", "") || "/"}
                    </Link>
                  </>
                ) : (
                  <span className="text-slate-600">End of flow</span>
                )}
              </span>
            </>
          ) : (
            <span className="text-slate-600">Demo mode</span>
          )}
        </div>
      </div>
    </nav>
  );
}
