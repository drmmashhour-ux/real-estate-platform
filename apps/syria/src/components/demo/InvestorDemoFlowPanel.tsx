import { Link } from "@/i18n/navigation";

const steps: { n: number; label: string; sub: string; href?: string }[] = [
  { n: 1, label: "Browse approved listings", sub: "Operator-approved stays only (safe surface).", href: "/sybnb" },
  { n: 2, label: "View a verified host", sub: "Trust signals + policy gates (demo data).", href: "/sybnb" },
  { n: 3, label: "Request a booking", sub: "Guest flow from an approved stay listing.", href: "/sybnb" },
  { n: 4, label: "Host confirms", sub: "Host console approves the request.", href: "/dashboard/bookings" },
  { n: 5, label: "Payment attempt → blocked safely", sub: "Policy returns DEMO_MODE — no real card charge.", href: "/demo" },
  { n: 6, label: "Admin trust dashboard", sub: "Operator queue & demo admin tools.", href: "/admin/sybnb/reports" },
];

export function InvestorDemoFlowPanel() {
  return (
    <ol className="space-y-3 rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-sm [dir=rtl]:text-right">
      <h2 className="text-base font-semibold text-stone-900">Guided investor flow (scripted)</h2>
      {steps.map((s) => (
        <li key={s.n} className="flex flex-col gap-1 border-b border-stone-100 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700">Step {s.n}</span>
            <p className="text-sm text-stone-800">{s.label}</p>
            <p className="text-xs text-stone-500">{s.sub}</p>
          </div>
          {s.href ? (
            <Link
              href={s.href as never}
              data-demo-record={`investor_flow_step_${s.n}`}
              className="shrink-0 text-sm font-medium text-amber-800 underline decoration-amber-300 hover:text-amber-950"
            >
              Open
            </Link>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
