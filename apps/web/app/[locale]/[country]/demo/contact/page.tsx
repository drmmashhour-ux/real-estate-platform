import Link from "next/link";
import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import {
  getDemoConversationPreview,
  getDemoCrmLeadPreview,
  getDemoRealEstateListing,
} from "@/src/modules/demo/demoDataService";
import { getDemoStepScript, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export const dynamic = "force-dynamic";

export default async function DemoContactPage() {
  const [listing, convo, lead] = await Promise.all([
    getDemoRealEstateListing(),
    getDemoConversationPreview(),
    getDemoCrmLeadPreview(),
  ]);
  const script = getDemoStepScript("contact");
  const points = getShortTalkingPoints("contact");

  const exampleMessage =
    "We’re pre-approved and would like a showing this weekend. Please loop in a platform broker for the visit.";

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-white">Contact / inquiry</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{script}</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Property context</p>
        <p className="mt-2 text-lg font-medium text-white">{listing.title}</p>
        <p className="text-sm text-slate-500">{listing.location}</p>
        <p className="mt-2 text-amber-200/90">{listing.priceLabel}</p>
        <Link href={`/demo/property/${encodeURIComponent(listing.id)}`} className="mt-3 inline-block text-xs text-amber-400 hover:underline">
          ← Back to property
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
          <h3 className="text-sm font-semibold text-white">Simulated send</h3>
          <label className="mt-4 block text-xs text-slate-500">Message</label>
          <div className="mt-2 rounded-lg border border-slate-700 bg-black/40 p-4 text-sm text-slate-300">{exampleMessage}</div>
          <p className="mt-4 text-xs text-slate-600">Demo mode: no outbound email is sent from this page.</p>
        </div>

        <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5">
          <h3 className="text-sm font-semibold text-emerald-200/90">Routing result</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Inquiry attributed to listing + campaign</li>
            <li>• Broker pool notified (platform broker available)</li>
            <li>• Lead scored for CRM priority</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-400">Conversation preview</h3>
          <p className="mt-2 text-xs text-slate-600">{convo.channel}</p>
          <p className="mt-3 text-sm text-slate-300">{convo.preview}</p>
          <p className="mt-2 text-xs text-slate-600">
            From {convo.from} · {convo.at.slice(0, 19)}Z
          </p>
        </div>
        <div className="rounded-xl border border-amber-900/25 bg-amber-950/10 p-5">
          <h3 className="text-sm font-semibold text-amber-200/90">CRM lead created</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-right text-white">{lead.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Stage</dt>
              <dd className="text-right text-amber-200/90">{lead.stage}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Score / tier</dt>
              <dd className="text-right text-white">
                {lead.score} · {lead.aiTier}
              </dd>
            </div>
            <div className="border-t border-slate-800 pt-3">
              <p className="text-xs text-slate-500">Next action</p>
              <p className="mt-1 text-slate-300">{lead.nextAction}</p>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5">
          <p className="text-xs font-semibold uppercase text-rose-400/80">Before</p>
          <p className="mt-2 text-sm text-slate-400">Browsing only — no shared record, no broker handoff, no pipeline.</p>
        </div>
        <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5">
          <p className="text-xs font-semibold uppercase text-emerald-400/80">After</p>
          <p className="mt-2 text-sm text-slate-300">Actionable pipeline — CRM row, routing, and next-best-action in one system.</p>
        </div>
      </div>

      <ul className="text-sm text-slate-500">
        {points.map((p) => (
          <li key={p}>— {p}</li>
        ))}
      </ul>

      <InvestorDemoClient highlightStep="contact" />
    </div>
  );
}
