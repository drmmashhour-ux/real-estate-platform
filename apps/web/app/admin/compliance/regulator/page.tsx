import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getGuestId } from "@/lib/auth/session";
import { isComplianceOversightStaff } from "@/lib/admin/compliance-access";
import { prisma } from "@repo/db";
import { COMPLIANCE_POLICY, OACIQ_OUTREACH_TEMPLATES } from "@/lib/compliance/oaciq/compliance-policy";
import { REGULATOR_MARKETING_ALLOWED_EXAMPLES } from "@/lib/compliance/oaciq/regulator-claim-guard";
import { createRegulatorCorrespondenceAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regulator correspondence — Compliance",
  description: "Track OACIQ outreach, responses, and recommendations. Internal use only.",
};

export default async function RegulatorCompliancePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!isComplianceOversightStaff(user?.role)) redirect("/");

  const records = await prisma.complianceRegulatorCorrespondence.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      regulatorKey: true,
      channel: true,
      status: true,
      subject: true,
      outboundSummary: true,
      inboundSummary: true,
      feedbackNotes: true,
      recommendations: true,
      occurredAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-10 text-slate-200">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-2xl font-semibold text-white">Compliance — regulator engagement</h1>
          <p className="mt-2 text-sm text-slate-400">
            Internal operational log. Does not constitute legal advice. Positioning: credibility without implying OACIQ
            approval — prefer “operated by a licensed broker” and “aligned with Québec regulations.”
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Internal policy (summary)</h2>
          <p className="text-sm text-slate-300">{COMPLIANCE_POLICY.summary}</p>
          <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1">
            {COMPLIANCE_POLICY.brokerPlatformUse.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">UI / marketing claim control</h2>
          <p className="text-sm text-slate-300">
            CI scans the web app for forbidden phrases (see <code className="text-amber-100/90">regulator-claim-guard.ts</code>
            ). Allowed positioning examples:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-300">
            {REGULATOR_MARKETING_ALLOWED_EXAMPLES.map((ex) => (
              <li key={ex}>&ldquo;{ex}&rdquo;</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">OACIQ — request for guidance (template)</h2>
          <p className="text-xs text-slate-500">Copy into your official email client. Edit bracketed fields.</p>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap">
            <div className="text-slate-500 mb-2">Subject: {OACIQ_OUTREACH_TEMPLATES.requestGuidanceEmail.suggestedSubject}</div>
            {OACIQ_OUTREACH_TEMPLATES.requestGuidanceEmail.body}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Log correspondence</h2>
          <form action={createRegulatorCorrespondenceAction} className="grid gap-4 text-sm">
            <div className="grid gap-1">
              <label className="text-slate-500">Regulator</label>
              <input
                name="regulatorKey"
                defaultValue="oaciq"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <label className="text-slate-500">Channel</label>
                <select name="channel" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white">
                  <option value="email">email</option>
                  <option value="call">call</option>
                  <option value="meeting">meeting</option>
                  <option value="portal">portal</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-slate-500">Status</label>
                <select name="status" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white">
                  <option value="draft">draft</option>
                  <option value="sent">sent</option>
                  <option value="responded">responded</option>
                  <option value="closed">closed</option>
                </select>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-slate-500">Subject</label>
              <input name="subject" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white" />
            </div>
            <div className="grid gap-1">
              <label className="text-slate-500">Outbound (what we asked / sent)</label>
              <textarea name="outboundSummary" rows={4} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white" />
            </div>
            <div className="grid gap-1">
              <label className="text-slate-500">Inbound (regulator reply summary)</label>
              <textarea name="inboundSummary" rows={3} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white" />
            </div>
            <div className="grid gap-1">
              <label className="text-slate-500">Feedback notes</label>
              <textarea name="feedbackNotes" rows={3} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white" />
            </div>
            <div className="grid gap-1">
              <label className="text-slate-500">Recommendations / follow-ups</label>
              <textarea name="recommendations" rows={3} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white" />
            </div>
            <div className="grid gap-1">
              <label className="text-slate-500">Occurred at (optional, ISO date)</label>
              <input name="occurredAt" type="date" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white" />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/15 border border-white/10"
            >
              Save entry
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent entries</h2>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500">No rows yet.</p>
          ) : (
            <ul className="space-y-4">
              {records.map((r) => (
                <li key={r.id} className="rounded-lg border border-white/5 bg-black/20 p-4 text-sm">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{r.regulatorKey}</span>
                    <span>·</span>
                    <span>{r.channel}</span>
                    <span>·</span>
                    <span>{r.status}</span>
                    <span>·</span>
                    <span>{r.createdAt.toISOString().slice(0, 10)}</span>
                  </div>
                  {r.subject ? <p className="mt-2 font-medium text-white">{r.subject}</p> : null}
                  {r.outboundSummary ? <p className="mt-2 text-slate-400 whitespace-pre-wrap">{r.outboundSummary}</p> : null}
                  {r.inboundSummary ? <p className="mt-2 text-slate-300 whitespace-pre-wrap">Reply: {r.inboundSummary}</p> : null}
                  {r.feedbackNotes ? <p className="mt-2 text-slate-400 whitespace-pre-wrap">Feedback: {r.feedbackNotes}</p> : null}
                  {r.recommendations ? (
                    <p className="mt-2 text-amber-100/80 whitespace-pre-wrap">Next: {r.recommendations}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
