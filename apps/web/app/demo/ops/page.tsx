import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import { getDemoCrmLeadPreview, getDemoConversationPreview } from "@/src/modules/demo/demoDataService";
import { getDemoStepScript, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export const dynamic = "force-dynamic";

export default async function DemoOpsPage() {
  const [lead, convo] = await Promise.all([getDemoCrmLeadPreview(), getDemoConversationPreview()]);
  const script = getDemoStepScript("ops");
  const points = getShortTalkingPoints("ops");

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-white">CRM · AI · close</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{script}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-black/20 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">Top priority</p>
          <p className="mt-2 text-xl font-semibold text-white">{lead.name}</p>
          <p className="text-sm text-slate-500">{lead.email}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200/90">Stage: {lead.stage}</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">Score {lead.score}</span>
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200/90">AI: {lead.aiTier}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI suggested next action</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{lead.nextAction}</p>
          <p className="mt-4 text-xs text-slate-600">Rule-based + CRM signals — investor view, not full admin.</p>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white">Broker routing</h3>
          <p className="mt-2 text-sm text-slate-400">
            Inquiry matched to market + availability → platform broker or tenant broker queue → SLA nudges.
          </p>
          <p className="mt-3 text-xs text-emerald-400/80">Result: assigned lane + visible next touch</p>
        </section>
        <section className="rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white">Close queue</h3>
          <p className="mt-2 text-sm text-slate-400">
            Hot leads and in-progress bookings surface here so nothing stalls between browse and transaction.
          </p>
          <p className="mt-3 text-xs text-amber-400/80">1 item prioritized (demo narrative)</p>
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h3 className="text-sm font-semibold text-slate-400">Latest touchpoint</h3>
        <p className="mt-2 text-sm text-slate-300">{convo.preview}</p>
        <p className="mt-2 text-xs text-slate-600">{convo.channel}</p>
      </section>

      <p className="rounded-lg border border-slate-800 bg-slate-900/20 px-4 py-3 text-sm text-slate-400">
        This is how we move users from browsing to transactions — one system, not a patchwork of inboxes.
      </p>

      <ul className="text-sm text-slate-500">
        {points.map((p) => (
          <li key={p}>— {p}</li>
        ))}
      </ul>

      <InvestorDemoClient highlightStep="ops" />
    </div>
  );
}
