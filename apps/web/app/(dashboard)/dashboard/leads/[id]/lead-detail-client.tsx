"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  extractEvaluationSnapshot,
  extractLeadCity,
} from "@/lib/leads/timeline-helpers";
import { SalesAssistantPanel } from "./sales-assistant";
import { getDmTemplateForLead, type DmTemplateKey } from "@/lib/leads/dm-templates";
import { getContactWhatsAppUrl } from "@/lib/config/contact";
import { ImmoPlatformCollaborationClause } from "@/components/immo/ImmoPlatformCollaborationClause";

type AutomationTaskRow = {
  id: string;
  taskKey: string;
  title: string;
  dueAt: string;
  status: string;
  completedAt?: string | null;
};

type LeadTaskRow = {
  id: string;
  taskKey?: string | null;
  title: string;
  status: string;
  priority: string;
  dueAt?: string | null;
  createdAt: string;
};

type LeadDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  score: number;
  status: string;
  pipelineStatus: string;
  pipelineStage?: string;
  contactOrigin?: string | null;
  contactOriginLabel?: string | null;
  commissionEligible?: boolean;
  platformConversationId?: string | null;
  listingCode?: string | null;
  deal?: {
    id: string;
    status: string;
    leadContactOrigin?: string | null;
    commissionEligible?: boolean;
  } | null;
  contactAuditEvents?: { id: string; eventType: string; createdAt: string; metadata?: unknown }[];
  dealValue?: number | null;
  commissionEstimate?: number | null;
  lastContactedAt?: string | null;
  nextActionAt?: string | null;
  meetingAt?: string | null;
  meetingCompleted?: boolean;
  postMeetingOutcome?: string | null;
  finalSalePrice?: number | null;
  finalCommission?: number | null;
  dealClosedAt?: string | null;
  lostReason?: string | null;
  leadSource: string | null;
  aiExplanation: unknown;
  nextFollowUpAt: string | null;
  reminderStatus: string | null;
  createdAt: string;
  dmStatus?: string;
  lastDmAt?: string | null;
  highIntent?: boolean;
  engagementScore?: number;
  scoreLevel?: string | null;
  evaluationEmailStatus?: string | null;
  lastAutomationEmailAt?: string | null;
  automationTasks?: AutomationTaskRow[];
  leadTasks?: LeadTaskRow[];
  automation?: {
    dmSuggestions: { id: string; title: string; detail: string }[];
    recommendedAction: { label: string; reason: string; kind: string };
  };
  crmInteractions: {
    id: string;
    type: string;
    body: string;
    createdAt: string;
    broker: { name: string | null; email: string };
  }[];
};

type TimelineEvent = {
  id: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
};

export function LeadDetailClient({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [note, setNote] = useState("");
  const [finalSaleInput, setFinalSaleInput] = useState("");
  const [wonNotes, setWonNotes] = useState("");
  const [lostReasonPick, setLostReasonPick] = useState("no_response");
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [lr, tr] = await Promise.all([
      fetch(`/api/leads/${leadId}`, { credentials: "same-origin" }),
      fetch(`/api/leads/${leadId}/timeline`, { credentials: "same-origin" }),
    ]);
    if (!lr.ok) {
      setError("Could not load lead.");
      return;
    }
    setLead(await lr.json());
    if (tr.ok) {
      const tj = await tr.json();
      setTimeline(Array.isArray(tj.events) ? tj.events : []);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: leadId, ...body }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Failed");
      return;
    }
    await load();
  };

  const sendNote = async () => {
    if (!note.trim()) return;
    await patch({ note: note.trim() });
    setNote("");
  };

  const setReminderPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    patch({ nextFollowUpAt: d.toISOString(), reminderStatus: "pending" });
  };

  const [dmNotice, setDmNotice] = useState("");

  const sendDmTemplate = async (key: DmTemplateKey) => {
    if (!lead) return;
    const snapInner = extractEvaluationSnapshot(lead.aiExplanation);
    const cityLocal =
      snapInner?.city ?? extractLeadCity({ aiExplanation: lead.aiExplanation, message: lead.message });
    const text = getDmTemplateForLead(key, { name: lead.name, city: cityLocal });
    try {
      await navigator.clipboard.writeText(text);
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: leadId,
          markDmSent: true,
          dmTemplateKey: key,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setDmNotice(typeof j.error === "string" ? j.error : "Could not update DM status.");
        return;
      }
      setDmNotice(`Copied “${key}” DM to clipboard and marked as sent.`);
      await load();
    } catch {
      setDmNotice("Could not copy — try again or copy manually from templates.");
    }
  };

  const sendFollowUpEmail = async (templateId: "evaluation_followup_2" | "evaluation_followup_3") => {
    setSending(templateId);
    try {
      const res = await fetch(`/api/leads/${leadId}/follow-up-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ templateId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) alert(j.error ?? "Send failed");
      else {
        if (j.sent) {
          await fetch(`/api/leads/${leadId}/assistant-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ type: "sales_email_sent", payload: { templateId } }),
          }).catch(() => {});
        }
        alert(j.sent ? "Email sent." : "Email skipped (Resend off or not configured).");
      }
      load();
    } finally {
      setSending(null);
    }
  };

  if (error || !lead) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white">
        <p className="text-[#B3B3B3]">{error || "Loading…"}</p>
        <Link href="/dashboard/leads" className="mt-4 inline-block text-[#C9A646]">
          ← Back
        </Link>
      </main>
    );
  }

  const snap = extractEvaluationSnapshot(lead.aiExplanation);
  const city = snap?.city ?? extractLeadCity({ aiExplanation: lead.aiExplanation, message: lead.message });
  const pipeline = lead.pipelineStatus || lead.status;
  const dealDollars = lead.dealValue ?? snap?.estimate ?? null;
  const commEst = lead.commissionEstimate ?? null;
  const dmStatus = lead.dmStatus ?? "none";
  const lastDm = lead.lastDmAt ? new Date(lead.lastDmAt) : null;
  const suggestFollowUpDm =
    dmStatus === "sent" &&
    lastDm != null &&
    !Number.isNaN(lastDm.getTime()) &&
    Date.now() - lastDm.getTime() >= 24 * 60 * 60 * 1000;
  const waHref = getContactWhatsAppUrl(
    getDmTemplateForLead("initial", { name: lead.name, city })
  );

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/dashboard/leads" className="text-sm font-medium text-[#C9A646] hover:underline">
          ← All leads
        </Link>

        <h1 className="mt-6 text-2xl font-bold">{lead.name}</h1>
        <p className="text-sm text-[#B3B3B3]">
          {lead.email} · {lead.phone}
        </p>
        {lead.contactOrigin === "IMMO_CONTACT" ? (
          <div className="mt-4 rounded-xl border border-[#C9A646]/35 bg-[#1a1508] px-4 py-3 text-xs leading-relaxed text-[#E8D5A3]">
            <p>
              <span className="font-bold uppercase tracking-wide text-[#C9A646]">ImmoContact</span>
              <span className="text-[#B3B3B3]"> · platform-originated contact</span>
            </p>
            <p className="mt-1 text-[#B3B3B3]">
              Recorded {new Date(lead.createdAt).toLocaleString()}
              {lead.listingCode ? (
                <>
                  {" "}
                  · Listing <span className="font-mono text-[#E8D5A3]">{lead.listingCode}</span>
                </>
              ) : null}
              {lead.commissionEligible ? (
                <span className="text-[#C9A646]"> · Commission-eligible (platform rules)</span>
              ) : null}
            </p>
            <p className="mt-2 text-[#737373]">
              By serving this lead, you acknowledge it was introduced through the platform.
            </p>
            {lead.deal?.id ? (
              <p className="mt-2 text-xs text-[#737373]">
                Linked deal:{" "}
                <span className="font-mono text-[#C9A646]">{lead.deal.id.slice(0, 8)}…</span> ({lead.deal.status})
              </p>
            ) : null}
            <details className="mt-4 border-t border-[#C9A646]/20 pt-3">
              <summary className="cursor-pointer list-none text-[11px] font-semibold text-[#C9A646] marker:hidden hover:underline [&::-webkit-details-marker]:hidden">
                Full ImmoContact &amp; platform collaboration clause (broker)
              </summary>
              <div className="mt-3 max-h-[min(420px,55vh)] overflow-y-auto pr-1">
                <ImmoPlatformCollaborationClause />
              </div>
            </details>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/leads/pipeline"
            className="rounded-xl border border-[#C9A646]/50 px-4 py-2 text-xs font-semibold text-[#C9A646] hover:bg-[#C9A646]/10"
          >
            Pipeline board
          </Link>
          <Link
            href="/dashboard/training"
            className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:border-[#C9A646]/40"
          >
            Training
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Property</p>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              {snap?.address && (
                <>
                  <span className="text-white">{snap.address}</span>
                  <br />
                </>
              )}
              {city} · {snap?.propertyType ?? "—"}
              <br />
              {snap?.sqft != null && `${snap.sqft} sqft · `}
              {snap?.bedrooms != null && `${snap.bedrooms} bed / `}
              {snap?.bathrooms != null && `${snap.bathrooms} bath`}
            </p>
          </div>
          <div className="rounded-2xl border border-[#C9A646]/30 bg-[#121212] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">AI estimate</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">
              {snap?.estimate != null ? `$${snap.estimate.toLocaleString()}` : "—"}
            </p>
            {snap?.minValue != null && snap?.maxValue != null ? (
              <p className="text-sm text-[#B3B3B3]">
                Range ${snap.minValue.toLocaleString()} – ${snap.maxValue.toLocaleString()}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[#737373]">
              Score <span className="font-bold text-[#E8C547]">{lead.score}</span>
              {lead.scoreLevel ? (
                <>
                  {" "}
                  · <span className="text-[#C9A646]">{lead.scoreLevel}</span>
                </>
              ) : null}{" "}
              · Engagement{" "}
              <span className="font-bold text-[#E8C547]">{lead.engagementScore ?? 0}</span> · Pipeline:{" "}
              <span className="capitalize text-white">{pipeline.replace("_", " ")}</span>
            </p>
            {lead.evaluationEmailStatus && lead.evaluationEmailStatus !== "none" ? (
              <p className="mt-1 text-xs text-[#737373]">
                Email automation:{" "}
                <span className="text-[#B3B3B3]">{lead.evaluationEmailStatus.replace(/_/g, " ")}</span>
                {lead.lastAutomationEmailAt
                  ? ` · ${new Date(lead.lastAutomationEmailAt).toLocaleString()}`
                  : ""}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Deal &amp; commission</p>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Deal value (est.):{" "}
              <span className="font-bold text-white">
                {dealDollars != null ? `$${dealDollars.toLocaleString()}` : "—"}
              </span>
            </p>
            <p className="mt-1 text-sm text-[#B3B3B3]">
              Est. broker commission (configurable rate):{" "}
              <span className="font-bold text-[#E8C547]">
                {commEst != null ? `$${commEst.toLocaleString()}` : "—"}
              </span>
            </p>
            {lead.finalSalePrice != null ? (
              <p className="mt-2 text-xs text-[#737373]">
                Closed: ${lead.finalSalePrice.toLocaleString()} · Commission:{" "}
                {lead.finalCommission != null ? `$${lead.finalCommission.toLocaleString()}` : "—"}
              </p>
            ) : null}
            {lead.lastContactedAt ? (
              <p className="mt-2 text-xs text-[#737373]">
                Last contacted: {new Date(lead.lastContactedAt).toLocaleString()}
              </p>
            ) : null}
            {lead.nextActionAt ? (
              <p className="text-xs text-[#737373]">
                Next action: {new Date(lead.nextActionAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>

        {/* Recommended action + tasks */}
        {(lead.automation?.recommendedAction || (lead.automationTasks && lead.automationTasks.length > 0)) && (
          <section className="mt-8 rounded-2xl border border-[#C9A646]/40 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-5 shadow-[0_0_0_1px_rgba(201, 166, 70,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Automation</p>
            {lead.automation?.recommendedAction ? (
              <div className="mt-3 rounded-xl border border-[#C9A646]/30 bg-black/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-[#B3B3B3]">Recommended action</p>
                <p className="mt-1 text-lg font-bold text-white">{lead.automation.recommendedAction.label}</p>
                <p className="mt-1 text-sm text-[#9CA3AF]">{lead.automation.recommendedAction.reason}</p>
              </div>
            ) : null}
            {lead.automation?.dmSuggestions && lead.automation.dmSuggestions.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {lead.automation.dmSuggestions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-white/10 bg-[#0B0B0B]/80 px-3 py-2 text-[#D4D4D4]"
                  >
                    <span className="font-semibold text-[#E8C547]">{s.title}</span>
                    <span className="block text-xs text-[#737373]">{s.detail}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {lead.automationTasks && lead.automationTasks.some((t) => t.status === "open") ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase text-[#C9A646]">Open tasks</p>
                <ul className="mt-2 space-y-2">
                  {lead.automationTasks
                    .filter((t) => t.status === "open")
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0B0B0B] px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium text-white">{t.title}</span>
                          <span className="ml-2 text-xs text-[#737373]">
                            Due {new Date(t.dueAt).toLocaleString()}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => void patch({ completeAutomationTaskId: t.id })}
                          className="rounded-lg border border-emerald-500/50 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Done
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            {lead.leadTasks && lead.leadTasks.some((t) => t.status === "pending") ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase text-[#C9A646]">Closing tasks (CRM)</p>
                <ul className="mt-2 space-y-2">
                  {lead.leadTasks
                    .filter((t) => t.status === "pending")
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#C9A646]/25 bg-[#0B0B0B] px-3 py-2 text-sm"
                      >
                        <span>
                          <span
                            className={`mr-2 rounded px-1.5 text-[10px] font-bold uppercase ${
                              t.priority === "urgent"
                                ? "bg-red-500/20 text-red-200"
                                : t.priority === "high"
                                  ? "bg-amber-500/20 text-amber-200"
                                  : "bg-white/10 text-[#9CA3AF]"
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="font-medium text-white">{t.title}</span>
                          {t.dueAt ? (
                            <span className="ml-2 text-xs text-[#737373]">
                              Due {new Date(t.dueAt).toLocaleString()}
                            </span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => void patch({ completeLeadTaskId: t.id })}
                          className="rounded-lg border border-emerald-500/50 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Done
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {/* DM automation — organic / social follow-up */}
        <section className="mt-8 rounded-2xl border border-[#C9A646]/35 bg-[#121212] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">DM automation</p>
          <p className="mt-1 text-sm text-[#B3B3B3]">
            Status: <span className="capitalize text-white">{dmStatus}</span>
            {lead.lastDmAt ? (
              <>
                {" "}
                · Last DM: {new Date(lead.lastDmAt).toLocaleString()}
              </>
            ) : null}
            {lead.highIntent ? (
              <span className="ml-2 rounded-full border border-[#C9A646]/50 px-2 py-0.5 text-[10px] font-bold text-[#C9A646]">
                High intent
              </span>
            ) : null}
          </p>
          {suggestFollowUpDm ? (
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <strong className="text-amber-200">Follow-up due (DM):</strong> No reply 24h+ after last send — use
              &quot;Follow-up DM&quot; below.
            </div>
          ) : null}
          {dmNotice ? <p className="mt-2 text-xs text-emerald-400">{dmNotice}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void sendDmTemplate("initial")}
              className="rounded-xl bg-[#C9A646] px-3 py-2 text-xs font-bold text-[#0B0B0B]"
            >
              Send initial DM (copy)
            </button>
            <button
              type="button"
              onClick={() => void sendDmTemplate("followUp")}
              className="rounded-xl border border-[#C9A646]/50 px-3 py-2 text-xs font-semibold text-[#C9A646] hover:bg-[#C9A646]/10"
            >
              Send follow-up DM (copy)
            </button>
            <button
              type="button"
              onClick={() => void sendDmTemplate("closing")}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5"
            >
              Send closing DM (copy)
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void (async () => {
                  await patch({ boostHighIntent: true });
                  setDmNotice("High intent saved — paste your message in WhatsApp.");
                })();
              }}
              className="inline-flex rounded-xl bg-[#25D366]/90 px-4 py-2 text-xs font-bold text-white hover:bg-[#25D366]"
            >
              Open WhatsApp
            </a>
            <span className="text-xs text-[#737373]">
              Pre-filled with launch DM #1 (personalized)
            </span>
            <button
              type="button"
              onClick={() => void patch({ markDmReplied: true })}
              className="rounded-xl border border-emerald-500/50 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
            >
              Mark DM replied
            </button>
          </div>
          <details className="mt-4 text-xs text-[#737373]">
            <summary className="cursor-pointer text-[#C9A646]">Preview template text</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-[#0B0B0B] p-3 text-[11px] text-[#B3B3B3]">
              {`initial:\n${getDmTemplateForLead("initial", { name: lead.name, city })}\n\nfollowUp:\n${getDmTemplateForLead("followUp", { name: lead.name, city })}\n\nclosing:\n${getDmTemplateForLead("closing", { name: lead.name, city })}`}
            </pre>
          </details>
        </section>

        <SalesAssistantPanel
          lead={{
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            score: lead.score,
            pipelineStatus: lead.pipelineStatus,
            leadSource: lead.leadSource,
            dealValue: lead.dealValue ?? null,
            lastContactedAt: lead.lastContactedAt ?? null,
            nextFollowUpAt: lead.nextFollowUpAt ?? null,
            meetingAt: lead.meetingAt ?? null,
            meetingCompleted: lead.meetingCompleted ?? false,
            postMeetingOutcome: lead.postMeetingOutcome ?? null,
            finalSalePrice: lead.finalSalePrice ?? null,
          }}
          city={city}
          propertyType={snap?.propertyType}
          snapEstimate={snap?.estimate}
          timeline={timeline}
          onPatch={patch}
          onReload={load}
          sendFollowUpEmail={sendFollowUpEmail}
          sendingEmail={sending}
          isEvaluationLead={lead.leadSource === "evaluation_lead"}
        />

        {/* Status actions */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-sm font-semibold text-white">Update status</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["contacted", "Mark contacted"],
              ["qualified", "Mark qualified"],
              ["meeting_scheduled", "Meeting scheduled"],
              ["negotiation", "Negotiation"],
              ["closing", "Closing"],
              ["won", "Mark won"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => patch({ pipelineStatus: k })}
                className="rounded-xl border border-[#C9A646]/40 px-3 py-2 text-xs font-semibold text-[#C9A646] hover:bg-[#C9A646]/10"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-950/10 p-3">
            <p className="text-xs font-semibold text-red-200">Mark lost</p>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">Requires confirmation — capture reason for reporting.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={lostReasonPick}
                onChange={(e) => setLostReasonPick(e.target.value)}
                className="rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-2 text-sm text-white"
              >
                <option value="price">Price</option>
                <option value="timing">Timing</option>
                <option value="no_response">No response</option>
                <option value="competitor">Chose competitor</option>
                <option value="other">Other</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm("Mark this lead as lost?")) return;
                  void patch({ pipelineStatus: "lost", lostReason: lostReasonPick });
                }}
                className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-bold text-red-200"
              >
                Confirm lost
              </button>
            </div>
            {lead.lostReason ? (
              <p className="mt-2 text-[11px] text-[#737373]">
                Reason on file: <span className="text-white">{lead.lostReason.replace(/_/g, " ")}</span>
              </p>
            ) : null}
          </div>
          <div id="close-deal-section" className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold text-[#C9A646]">Close deal (won)</p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <input
                type="number"
                placeholder="Final sale price"
                value={finalSaleInput}
                onChange={(e) => setFinalSaleInput(e.target.value)}
                className="min-w-[160px] rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Outcome notes (optional)"
                value={wonNotes}
                onChange={(e) => setWonNotes(e.target.value)}
                className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={async () => {
                  const n = parseInt(finalSaleInput.replace(/\D/g, ""), 10);
                  if (!Number.isFinite(n) || n <= 0) {
                    alert("Enter a valid final price.");
                    return;
                  }
                  await fetch(`/api/leads/${leadId}/assistant-event`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({
                      type: "sales_deal_closed",
                      payload: { finalSalePrice: n },
                    }),
                  }).catch(() => {});
                  await patch({
                    pipelineStatus: "won",
                    finalSalePrice: n,
                    finalDealValue: n,
                    dealOutcomeNotes: wonNotes.trim() || undefined,
                  });
                  setFinalSaleInput("");
                  setWonNotes("");
                }}
                className="rounded-xl bg-[#C9A646] px-3 py-2 text-xs font-bold text-[#0B0B0B]"
              >
                Save as won
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-sm font-semibold text-white">Activity</p>
          <p className="mt-1 text-xs text-[#737373]">
            Log an outbound call or touch — updates last contacted time for dashboards.
          </p>
          <button
            type="button"
            onClick={() => patch({ recordFollowUp: true })}
            className="mt-3 rounded-xl bg-[#C9A646] px-4 py-2 text-xs font-bold text-[#0B0B0B]"
          >
            Log contact (now)
          </button>
        </section>

        {/* Meeting */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-sm font-semibold text-white">Meeting</p>
          <p className="mt-1 text-xs text-[#737373]">
            Scheduled:{" "}
            {lead.meetingAt ? new Date(lead.meetingAt).toLocaleString() : "—"} ·{" "}
            {lead.meetingCompleted ? (
              <span className="text-emerald-400">Completed</span>
            ) : (
              <span className="text-amber-200/90">Not marked complete</span>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const raw = window.prompt("Meeting date/time (ISO or text)");
                if (!raw) return;
                const d = new Date(raw);
                if (!Number.isNaN(d.getTime())) patch({ meetingAt: d.toISOString() });
              }}
              className="rounded-xl border border-[#C9A646]/40 px-3 py-2 text-xs font-semibold text-[#C9A646]"
            >
              Schedule / edit meeting
            </button>
            <button
              type="button"
              onClick={() => patch({ meetingCompleted: true })}
              className="rounded-xl bg-[#C9A646] px-3 py-2 text-xs font-bold text-[#0B0B0B]"
            >
              Mark meeting completed
            </button>
          </div>
        </section>

        {/* Reminders */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-sm font-semibold text-white">Follow-up reminder</p>
          <p className="mt-1 text-xs text-[#737373]">
            Next follow-up:{" "}
            {lead.nextFollowUpAt
              ? new Date(lead.nextFollowUpAt).toLocaleString()
              : "Not set"}{" "}
            {lead.reminderStatus ? `· ${lead.reminderStatus}` : ""}
            {lead.nextActionAt ? (
              <>
                <br />
                Next action: {new Date(lead.nextActionAt).toLocaleString()}
              </>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReminderPreset(1)}
              className="rounded-xl bg-[#C9A646] px-3 py-2 text-xs font-bold text-[#0B0B0B]"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setReminderPreset(3)}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white"
            >
              In 3 days
            </button>
            <button
              type="button"
              onClick={() => setReminderPreset(7)}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white"
            >
              Next week
            </button>
            <button
              type="button"
              onClick={() => {
                const raw = window.prompt("Follow-up date (ISO or YYYY-MM-DD)");
                if (!raw) return;
                const d = new Date(raw);
                if (!Number.isNaN(d.getTime())) patch({ nextFollowUpAt: d.toISOString() });
              }}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white"
            >
              Custom date
            </button>
            <button
              type="button"
              onClick={() => patch({ nextFollowUpAt: null, reminderStatus: null })}
              className="rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Manual drip */}
        {lead.leadSource === "evaluation_lead" && (
          <section className="mt-8 rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-5">
            <p className="text-sm font-semibold text-white">Follow-up emails (manual)</p>
            <p className="mt-1 text-xs text-[#737373]">Sends only when you click — templates #2 and #3 prepared.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!sending}
                onClick={() => sendFollowUpEmail("evaluation_followup_2")}
                className="rounded-xl bg-[#C9A646] px-3 py-2 text-xs font-bold text-[#0B0B0B] disabled:opacity-50"
              >
                Send #2 — precise evaluation
              </button>
              <button
                type="button"
                disabled={!!sending}
                onClick={() => sendFollowUpEmail("evaluation_followup_3")}
                className="rounded-xl border border-[#C9A646]/50 px-3 py-2 text-xs font-semibold text-[#C9A646] disabled:opacity-50"
              >
                Send #3 — free consultation
              </button>
            </div>
          </section>
        )}

        {/* Notes */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-sm font-semibold text-white">Notes</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white focus:border-[#C9A646] focus:outline-none"
            placeholder="Log a note (author = you)…"
          />
          <button
            type="button"
            onClick={sendNote}
            className="mt-2 rounded-xl bg-[#C9A646] px-4 py-2 text-xs font-bold text-[#0B0B0B]"
          >
            Save note
          </button>
          <ul className="mt-4 space-y-3 border-t border-white/10 pt-4">
            {lead.crmInteractions.map((n) => (
              <li key={n.id} className="text-sm">
                <p className="text-[#737373]">
                  {new Date(n.createdAt).toLocaleString()} · {n.broker.name ?? n.broker.email}
                </p>
                <p className="text-[#E5E5E5] whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {lead.contactAuditEvents && lead.contactAuditEvents.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-5">
            <p className="text-sm font-semibold text-white">Platform contact audit</p>
            <p className="mt-1 text-xs text-[#737373]">Append-only record (who, when, listing).</p>
            <ul className="mt-4 space-y-2 text-sm">
              {lead.contactAuditEvents.map((ev) => (
                <li key={ev.id} className="border-l-2 border-[#C9A646]/50 pl-3">
                  <p className="text-xs text-[#737373]">{new Date(ev.createdAt).toLocaleString()}</p>
                  <p className="font-mono text-xs text-[#E8D5A3]">{ev.eventType}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Timeline */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-sm font-semibold text-white">Activity timeline</p>
          <ul className="mt-4 space-y-3">
            {timeline.length === 0 ? (
              <li className="text-sm text-[#737373]">No events yet.</li>
            ) : (
              timeline.map((ev) => (
                <li key={ev.id} className="border-l-2 border-[#C9A646]/40 pl-3 text-sm">
                  <p className="text-xs text-[#737373]">{new Date(ev.createdAt).toLocaleString()}</p>
                  <p className="font-semibold capitalize text-[#E8C547]">
                    {ev.eventType.replace(/_/g, " ")}
                  </p>
                  {ev.payload != null && typeof ev.payload === "object" ? (
                    <pre className="mt-1 max-h-24 overflow-auto text-[10px] text-[#9CA3AF]">
                      {JSON.stringify(ev.payload, null, 0)}
                    </pre>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="mt-10 text-xs text-[#737373]">Source: {lead.leadSource ?? "—"}</p>
      </div>
    </main>
  );
}
