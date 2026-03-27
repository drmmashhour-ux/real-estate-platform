"use client";

type Step = { label: string; state: "done" | "current" | "upcoming" };

/** Horizontal demo timeline — deterministic from application / lease / payments. */
export function RentLifecycleTimeline(props: {
  applicationStatus: string | null;
  leaseStatus: string | null;
  hasPayments: boolean;
}) {
  const app = (props.applicationStatus ?? "").toUpperCase();
  const lease = (props.leaseStatus ?? "").toUpperCase();

  const steps: Step[] = [
    { label: "Application sent", state: "upcoming" },
    { label: "Accepted", state: "upcoming" },
    { label: "Lease signed", state: "upcoming" },
    { label: "Payment tracked", state: "upcoming" },
  ];

  if (app === "PENDING") {
    steps[0].state = "current";
  } else if (app === "REJECTED") {
    steps[0].state = "done";
    steps[1].state = "upcoming";
  } else if (app === "ACCEPTED") {
    steps[0].state = "done";
    steps[1].state = lease === "PENDING_SIGNATURE" ? "current" : "done";
  }

  if (lease === "PENDING_SIGNATURE") {
    steps[2].state = "current";
  } else if (lease === "ACTIVE" || lease === "TERMINATED") {
    steps[2].state = "done";
  }

  if (props.hasPayments) {
    steps[3].state = lease === "ACTIVE" ? "done" : "current";
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-400/90">Your rent journey</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                s.state === "done"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : s.state === "current"
                    ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40"
                    : "bg-white/5 text-slate-500"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 ? <span className="text-slate-600">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
