import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";

const USER_FEATURES = [
  { title: "Smart recommendations", desc: "Properties based on your behavior and preferences", href: "/api/ai/recommendations", api: true },
  { title: "Smart search", desc: "Budget, location, lifestyle filters with AI ranking", href: "/search/bnhub", api: false },
  { title: "Match projects", desc: "AI-matched new developments to your profile", href: "/dashboard/investments/matches", api: false },
];

const OWNER_FEATURES = [
  { title: "Auto listing descriptions", desc: "Generate and optimize listing content", href: "/dashboard/listings", api: true },
  { title: "Price suggestions", desc: "AI-driven pricing and demand insights", href: "/dashboard/bnhub/pricing", api: false },
  { title: "Listing quality & host insights", desc: "Quality score and improvement tips", href: "/dashboard/bnhub", api: false },
];

const PLATFORM_FEATURES = [
  { title: "Fraud detection", desc: "Pattern recognition and risk scoring", href: "/admin/fraud-alerts", admin: true },
  { title: "Smart recommendations engine", desc: "Ranking and personalization", href: "/api/ai/ranking", api: true },
  { title: "Behavior analysis", desc: "Trust score and abuse prevention", href: "/admin/trust-safety", admin: true },
];

export default function AIControlCenterPage() {
  return (
    <HubLayout title="AI Control Center" hubKey="bnhub" navigation={hubNavigation.bnhub}>
      <div className="mx-auto max-w-4xl space-y-12 p-6">
        <section>
          <h1 className="text-2xl font-semibold text-slate-100">AI Control Center</h1>
          <p className="mt-2 text-slate-400">
            Centralized AI capabilities for users, owners, and platform operations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-200">For users</h2>
          <p className="mt-1 text-sm text-slate-500">Suggest properties, smart search, and matched projects</p>
          <ul className="mt-4 space-y-3">
            {USER_FEATURES.map((f) => (
              <li key={f.title}>
                <Link
                  href={f.href}
                  className="card-premium flex flex-col gap-1 p-4 transition hover:border-slate-600"
                >
                  <span className="font-medium text-slate-100">{f.title}</span>
                  <span className="text-sm text-slate-400">{f.desc}</span>
                  {f.api && <span className="text-xs text-slate-500">API available</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-200">For owners</h2>
          <p className="mt-1 text-sm text-slate-500">Auto descriptions, price optimization, quality insights</p>
          <ul className="mt-4 space-y-3">
            {OWNER_FEATURES.map((f) => (
              <li key={f.title}>
                <Link
                  href={f.href}
                  className="card-premium flex flex-col gap-1 p-4 transition hover:border-slate-600"
                >
                  <span className="font-medium text-slate-100">{f.title}</span>
                  <span className="text-sm text-slate-400">{f.desc}</span>
                  {f.api && <span className="text-xs text-slate-500">API available</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-slate-200">For platform</h2>
          <p className="mt-1 text-sm text-slate-500">Fraud detection, recommendations engine, behavior analysis</p>
          <ul className="mt-4 space-y-3">
            {PLATFORM_FEATURES.map((f) => (
              <li key={f.title}>
                <Link
                  href={f.href}
                  className="card-premium flex flex-col gap-1 p-4 transition hover:border-slate-600"
                >
                  <span className="font-medium text-slate-100">{f.title}</span>
                  <span className="text-sm text-slate-400">{f.desc}</span>
                  {f.api && <span className="text-xs text-slate-500">API available</span>}
                  {f.admin && <span className="text-xs text-amber-400">Admin</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
