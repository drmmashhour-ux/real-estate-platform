"use client";

import Link from "next/link";
import type { HubJourneyPlan } from "@/modules/journey/hub-journey.types";

export function HubNextStepCard({
  plan,
  basePath,
}: {
  plan: HubJourneyPlan | null;
  /** e.g. `/en/ca` for locale-prefixed CTAs */
  basePath: string;
}) {
  if (!plan) return null;
  const current = plan.steps.find((s) => s.id === plan.currentStepId);
  const next = plan.steps.find((s) => s.id === plan.nextStepId);
  const href =
    next?.route &&
    (next.route.startsWith("/") ? next.route : `${basePath.replace(/\/$/, "")}/${next.route.replace(/^\//, "")}`);

  return (
    <div
      id="hub-next-step-anchor"
      className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-zinc-950 to-black p-4 shadow-lg shadow-black/40"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
        Next steps
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-zinc-500">Current focus</p>
          <p className="mt-1 text-sm font-medium text-zinc-100">{current?.title ?? "—"}</p>
          {current?.blockers?.length ? (
            <p className="mt-2 text-xs text-red-200/90">{current.blockers[0]}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs text-zinc-500">Then</p>
          <p className="mt-1 text-sm font-medium text-zinc-200">{next?.title ?? "Complete the journey"}</p>
          {href ? (
            <Link
              href={href}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-400"
            >
              {next?.actionLabel ?? "Continue"}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
