import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { EarlyConversionCampaignTable } from "@/components/admin/early-users/EarlyConversionCampaignTable";
import { EarlyUsersTable } from "@/components/admin/early-users/EarlyUsersTable";
import { GrowthLeadsTable } from "@/components/admin/early-users/GrowthLeadsTable";
import { LeadIntelligenceSection } from "@/components/admin/leads/LeadIntelligenceSection";
import { LeadResponseDeskSection } from "@/components/admin/leads/LeadResponseDeskSection";

export const dynamic = "force-dynamic";

export default async function AdminEarlyUsersPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Acquisition</p>
      <h1 className="mt-2 text-3xl font-semibold">Early users — CRM</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Outreach + conversion tracking. Scale view (funnel, automation, leaderboard):{" "}
        <Link href="/admin/growth-crm" className="text-emerald-400 hover:text-emerald-300">
          /admin/growth-crm
        </Link>
        . Signup source rollups:{" "}
        <Link href="/admin/acquisition/traffic" className="text-emerald-400 hover:text-emerald-300">
          /admin/acquisition/traffic
        </Link>
        . Docs: <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/first-100-users.md</code>,{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/first-1000-users.md</code>. Public capture:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">/early-access</code>.
      </p>
      <Link href="/admin/launch" className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Launch tracking
      </Link>

      <section
        className="mt-10 rounded-2xl border border-premium-gold/25 bg-[#0f1419] p-6 text-sm text-slate-300"
        aria-labelledby="first-100-funnel"
      >
        <h2 id="first-100-funnel" className="text-base font-semibold text-white">
          First 100 users — funnel (manual ops)
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Lightweight links and checklist — not a CRM. Capture: POST <code className="rounded bg-slate-800 px-1">/api/growth/early-leads</code> →{" "}
          <code className="rounded bg-slate-800 px-1">FormSubmission</code> (<code className="rounded bg-slate-800 px-1">early_conversion_lead</code>).
        </p>
        <ul className="mt-4 space-y-2 text-slate-300">
          <li>
            <span className="text-premium-gold">Landing (public):</span>{" "}
            <Link href="/get-leads" className="text-emerald-400 hover:text-emerald-300">
              /get-leads
            </Link>{" "}
            → <code className="rounded bg-slate-800 px-1 text-xs">/en/ca/get-leads</code>
          </li>
          <li>
            <span className="text-premium-gold">Offer &amp; positioning:</span>{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">docs/growth/first-100-users-offer.md</code>
          </li>
          <li>
            <span className="text-premium-gold">Outreach scripts:</span>{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">docs/growth/outreach-scripts.md</code>
          </li>
          <li>
            <span className="text-premium-gold">Lead flow:</span>{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">docs/growth/lead-capture-flow.md</code>
          </li>
          <li>
            <span className="text-premium-gold">Daily plan / KPIs:</span>{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">docs/growth/first-100-users-daily-plan.md</code>,{" "}
            <code className="rounded bg-slate-800 px-1 text-xs">docs/growth/first-100-users-metrics.md</code>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          <strong className="font-medium text-slate-400">Daily targets (example):</strong> 30–50 outbound messages, 2–3 short videos, same-day
          follow-ups, 1–3 listings onboarded, move at least one conversation forward.
        </p>
      </section>

      <div className="mt-10 space-y-12">
        <LeadResponseDeskSection />
        <LeadIntelligenceSection />
        <EarlyConversionCampaignTable />
        <GrowthLeadsTable />
        <EarlyUsersTable />
      </div>
    </main>
  );
}
