"use client";

import { useCallback, useEffect, useState } from "react";
import { getSuggestedScript } from "@/lib/leads/smart-scripts";
import { getNextBestAction } from "@/lib/leads/next-action";
import { ASSISTANT_OBJECTIONS } from "@/lib/leads/training-objections";
import { normalizePipelineStage } from "@/lib/leads/pipeline-stage";
import { FOLLOWUP_TEMPLATES, type FollowupTemplateKey } from "@/lib/leads/followup-templates";
import {
  getBrokerTelHref,
  getContactEmail,
  getContactMailtoHref,
  getContactWhatsAppUrl,
} from "@/lib/config/contact";
import { PlaybookConversionStrip } from "@/components/leads/PlaybookConversionStrip";
import { CloseScriptsReference } from "@/components/leads/CloseScriptsReference";

type LeadAssistant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  pipelineStatus: string;
  leadSource: string | null;
  dealValue?: number | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  meetingAt?: string | null;
  meetingCompleted?: boolean;
  postMeetingOutcome?: string | null;
  finalSalePrice?: number | null;
};

type TimelineEv = { eventType: string };

const WA_PREFILL = "Hi, this is Mohamed from LECIPM regarding your property evaluation.";
const CLOSING_LINE =
  "Based on your needs, the best next step is to move forward now so we can secure the best opportunity and avoid delays.";

async function logAssistantEvent(leadId: string, type: string, payload?: Record<string, unknown>) {
  await fetch(`/api/lecipm/leads/${leadId}/assistant-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ type, payload }),
  }).catch(() => {});
}

type Props = {
  lead: LeadAssistant;
  city: string;
  propertyType: string | null | undefined;
  snapEstimate: number | null | undefined;
  timeline: TimelineEv[];
  onPatch: (body: Record<string, unknown>) => Promise<void>;
  onReload: () => void;
  sendFollowUpEmail: (id: "evaluation_followup_2" | "evaluation_followup_3") => Promise<void>;
  sendingEmail: string | null;
  isEvaluationLead: boolean;
};

export function SalesAssistantPanel({
  lead,
  city,
  propertyType,
  snapEstimate,
  timeline,
  onPatch,
  onReload,
  sendFollowUpEmail,
  sendingEmail,
  isEvaluationLead,
}: Props) {
  const [callMode, setCallMode] = useState(false);
  const [callLostReason, setCallLostReason] = useState("no_response");
  const [objectionsOpen, setObjectionsOpen] = useState(false);
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [meetNotes, setMeetNotes] = useState("");
  const [stats, setStats] = useState<{
    callsMade: number;
    whatsappSent: number;
    emailsSent: number;
    meetingsBooked: number;
    dealsClosed: number;
  } | null>(null);

  const script = getSuggestedScript({
    pipelineStatus: lead.pipelineStatus,
    name: lead.name,
    city,
    propertyType,
    dealValue: lead.dealValue ?? snapEstimate ?? null,
  });

  const hasConsult = timeline.some((e) => e.eventType === "consultation_requested");
  const nextAction = getNextBestAction(
    {
      pipelineStatus: lead.pipelineStatus,
      lastContactedAt: lead.lastContactedAt,
      nextFollowUpAt: lead.nextFollowUpAt,
      meetingAt: lead.meetingAt,
      leadSource: lead.leadSource,
    },
    { hasRecentConsultationClick: hasConsult }
  );

  const stage = normalizePipelineStage(lead.pipelineStatus);
  const brokerTel = getBrokerTelHref();
  const waHref =
    lead.phone && !lead.phone.startsWith("[")
      ? getContactWhatsAppUrl(`${WA_PREFILL}`)
      : getContactWhatsAppUrl(WA_PREFILL);

  const mailToClient =
    lead.email && !lead.email.startsWith("[")
      ? `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent("Following up — LECIPM / Mohamed Al Mashhour")}&body=${encodeURIComponent(
          `Hi ${lead.name.split(/\s+/)[0] || ""},\n\n` +
            "Following up on your property — happy to answer questions or book a quick call.\n\n" +
            "— Mohamed Al Mashhour, LECIPM\n" +
            getContactEmail()
        )}`
      : getContactMailtoHref();

  useEffect(() => {
    void fetch("/api/lecipm/leads/assistant-stats", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.callsMade === "number") setStats(j);
      })
      .catch(() => {});
  }, [lead.id, lead.pipelineStatus]);

  const runNextAction = useCallback(async () => {
    switch (nextAction.key) {
      case "call_now":
        void logAssistantEvent(lead.id, "sales_call_started");
        window.location.href = brokerTel;
        break;
      case "send_whatsapp":
        void logAssistantEvent(lead.id, "sales_whatsapp_sent");
        window.open(waHref, "_blank", "noopener,noreferrer");
        break;
      case "schedule_meeting":
        document.getElementById("sales-meeting-helper")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "send_follow_up_email":
        if (isEvaluationLead) {
          await sendFollowUpEmail("evaluation_followup_2");
        } else {
          await logAssistantEvent(lead.id, "sales_email_sent", { channel: "generic_intent" });
        }
        break;
      case "mark_won":
        document.getElementById("close-deal-section")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "move_to_closing":
        await onPatch({ pipelineStatus: "closing" });
        break;
      case "send_closing_followup":
        await navigator.clipboard.writeText(FOLLOWUP_TEMPLATES.preClosing);
        await logAssistantEvent(lead.id, "sales_closing_followup_copied");
        alert("Closing follow-up copied — paste in WhatsApp or email.");
        break;
      case "schedule_final_call":
        document.getElementById("sales-meeting-helper")?.scrollIntoView({ behavior: "smooth" });
        break;
      default:
        void logAssistantEvent(lead.id, "sales_call_started");
        window.location.href = brokerTel;
    }
    onReload();
  }, [
    nextAction.key,
    lead.id,
    brokerTel,
    waHref,
    isEvaluationLead,
    sendFollowUpEmail,
    onReload,
  ]);

  return (
    <>
      <PlaybookConversionStrip leadId={lead.id} />
      <CloseScriptsReference leadName={lead.name} />
      <section className="mt-8 rounded-2xl border-2 border-premium-gold/40 bg-gradient-to-b from-[#1A1508] to-[#121212] p-5 shadow-lg shadow-black/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-premium-gold">Sales Assistant</p>
            <h2 className="mt-1 text-xl font-bold text-white">Close with confidence</h2>
            <p className="mt-1 text-sm text-[#B3B3B3]">
              Live scripts, next step, and one-tap actions—built for Mohamed Al Mashhour (LECIPM).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void logAssistantEvent(lead.id, "sales_call_started");
              setCallMode(true);
            }}
            className="shrink-0 rounded-xl bg-premium-gold px-4 py-3 text-sm font-bold text-[#0B0B0B] hover:opacity-95"
          >
            Start call mode
          </button>
        </div>

        {/* Next best action */}
        <div className="mt-6 rounded-xl border border-premium-gold/30 bg-black/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-premium-gold">Next best action</p>
            {lead.score >= 80 ? (
              <span className="rounded-full border border-orange-500/50 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-200">
                Urgent
              </span>
            ) : lead.score >= 50 ? (
              <span className="rounded-full border border-premium-gold/40 bg-premium-gold/10 px-2 py-0.5 text-[10px] font-bold text-premium-gold">
                Priority
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-lg font-bold text-white">{nextAction.label}</p>
          <p className="mt-1 text-sm text-[#B3B3B3]">{nextAction.hint}</p>
          <button
            type="button"
            onClick={() => runNextAction()}
            className="mt-3 rounded-xl border border-premium-gold bg-premium-gold/15 px-4 py-2 text-sm font-bold text-premium-gold hover:bg-premium-gold/25"
          >
            Do this now
          </button>
        </div>

        {/* Lead summary */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0B0B0B]/80 p-4">
            <p className="text-[10px] font-semibold uppercase text-[#737373]">Lead summary</p>
            <ul className="mt-2 space-y-1 text-sm text-[#E5E5E5]">
              <li>
                <span className="text-[#737373]">Stage:</span>{" "}
                <span className="capitalize text-premium-gold">{stage.replace(/_/g, " ")}</span>
              </li>
              <li>
                <span className="text-[#737373]">Market:</span> {city || "—"}
              </li>
              <li>
                <span className="text-[#737373]">Est. value:</span>{" "}
                {lead.dealValue != null || snapEstimate != null
                  ? `$${(lead.dealValue ?? snapEstimate ?? 0).toLocaleString()}`
                  : "—"}
              </li>
              <li>
                <span className="text-[#737373]">Score:</span>{" "}
                <span className="font-bold text-premium-gold">{lead.score}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0B0B0B]/80 p-4">
            <p className="text-[10px] font-semibold uppercase text-[#737373]">Suggested script — {script.title}</p>
            <dl className="mt-2 space-y-2 text-sm text-[#B3B3B3]">
              <div>
                <dt className="text-xs font-bold uppercase text-premium-gold/90">Opening</dt>
                <dd className="mt-0.5 leading-relaxed text-white">{script.opening}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-premium-gold/90">Questions</dt>
                <dd className="mt-0.5 leading-relaxed">{script.questions}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-premium-gold/90">Value</dt>
                <dd className="mt-0.5 leading-relaxed">{script.valueStatement}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-premium-gold/90">Closing</dt>
                <dd className="mt-0.5 font-medium text-premium-gold">{script.closingQuestion}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">Quick actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={brokerTel}
              onClick={() => void logAssistantEvent(lead.id, "sales_call_started")}
              className="inline-flex items-center justify-center rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-[#0B0B0B]"
            >
              Call now
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => void logAssistantEvent(lead.id, "sales_whatsapp_sent")}
              className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-4 py-2 text-sm font-bold text-white"
            >
              WhatsApp
            </a>
            <a
              href={mailToClient}
              onClick={() => void logAssistantEvent(lead.id, "sales_email_sent")}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-premium-gold/50"
            >
              Send email
            </a>
            {isEvaluationLead ? (
              <button
                type="button"
                disabled={!!sendingEmail}
                onClick={async () => {
                  await sendFollowUpEmail("evaluation_followup_2");
                }}
                className="rounded-xl border border-premium-gold/50 px-4 py-2 text-sm font-semibold text-premium-gold disabled:opacity-50"
              >
                Send template email
              </button>
            ) : null}
          </div>
        </div>

        {/* Follow-up templates (copy) */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#0B0B0B]/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Follow-up templates</p>
          <p className="mt-1 text-xs text-[#737373]">Copy prefilled messages — you edit before sending.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["first", "First follow-up"],
                ["noReply", "After no reply"],
                ["preClosing", "Pre-closing"],
                ["afterMeeting", "After meeting"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(FOLLOWUP_TEMPLATES[key as FollowupTemplateKey]);
                  void logAssistantEvent(lead.id, "followup_template_copied", { key });
                }}
                className="rounded-lg border border-premium-gold/40 px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Closing assistant (negotiation + closing) */}
        {(stage === "negotiation" || stage === "closing") && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <p className="text-sm font-bold text-emerald-200">Closing assistant</p>
            <p className="mt-2 text-xs uppercase text-emerald-400/90">Summary</p>
            <ul className="mt-1 text-sm text-white/90">
              <li>
                Stage: <span className="text-premium-gold">{stage.replace(/_/g, " ")}</span>
              </li>
              <li>
                Est. value:{" "}
                {lead.dealValue != null || snapEstimate != null
                  ? `$${(lead.dealValue ?? snapEstimate ?? 0).toLocaleString()}`
                  : "—"}
              </li>
              <li>
                Urgency:{" "}
                <span className="font-semibold text-premium-gold">
                  {lead.score >= 80 ? "High" : lead.score >= 50 ? "Medium" : "Nurture"}
                </span>
              </li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-emerald-100/90">Suggested closing script</p>
            <p className="mt-2 text-base leading-relaxed text-white">{CLOSING_LINE}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                id="assistant-mark-won"
                onClick={async () => {
                  await logAssistantEvent(lead.id, "sales_deal_closed", { action: "mark_won_click" });
                  document.getElementById("close-deal-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
              >
                Mark won
              </button>
              <button
                type="button"
                onClick={() => {
                  setCallMode(false);
                  document.getElementById("sales-meeting-helper")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-100"
              >
                Schedule final call
              </button>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(FOLLOWUP_TEMPLATES.preClosing);
                  void logAssistantEvent(lead.id, "sales_closing_followup_copied");
                }}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Send closing follow-up (copy)
              </button>
            </div>
          </div>
        )}

        {/* Meeting helper */}
        <div id="sales-meeting-helper" className="mt-6 rounded-xl border border-white/10 bg-[#0B0B0B]/60 p-4">
          <p className="text-sm font-semibold text-white">Schedule meeting</p>
          <p className="mt-1 text-xs text-[#737373]">Sets stage to Meeting scheduled and logs activity.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              type="date"
              value={meetDate}
              onChange={(e) => setMeetDate(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white"
            />
            <input
              type="time"
              value={meetTime}
              onChange={(e) => setMeetTime(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white"
            />
          </div>
          <textarea
            value={meetNotes}
            onChange={(e) => setMeetNotes(e.target.value)}
            placeholder="Notes (access, spouse present, documents…)"
            rows={2}
            className="mt-3 w-full rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white placeholder:text-[#737373]"
          />
          <button
            type="button"
            onClick={async () => {
              if (!meetDate || !meetTime) {
                alert("Pick date and time.");
                return;
              }
              const local = new Date(`${meetDate}T${meetTime}:00`);
              if (Number.isNaN(local.getTime())) {
                alert("Invalid date/time.");
                return;
              }
              const iso = local.toISOString();
              const noteBlock = `Meeting scheduled: ${local.toLocaleString()}${meetNotes ? `\n${meetNotes}` : ""}`;
              await logAssistantEvent(lead.id, "sales_meeting_scheduled", {
                at: iso,
                notes: meetNotes || undefined,
              });
              await onPatch({
                meetingAt: iso,
                pipelineStatus: "meeting_scheduled",
                note: noteBlock,
              });
              setMeetNotes("");
            }}
            className="mt-3 rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-[#0B0B0B]"
          >
            Save meeting &amp; set stage
          </button>
        </div>

        {/* Post-meeting outcome */}
        {lead.meetingAt ? (
          <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
            <p className="text-sm font-bold text-blue-200">After meeting</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Mark how the conversation landed — the CRM will suggest next tasks (nothing auto-closes).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void onPatch({
                    postMeetingOutcome: "interested",
                    meetingCompleted: true,
                    note: "Post-meeting: interested",
                  })
                }
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
              >
                Interested
              </button>
              <button
                type="button"
                onClick={() =>
                  void onPatch({
                    postMeetingOutcome: "needs_follow_up",
                    meetingCompleted: true,
                    note: "Post-meeting: needs follow-up",
                  })
                }
                className="rounded-xl border border-blue-400/50 px-3 py-2 text-xs font-semibold text-blue-100"
              >
                Needs follow-up
              </button>
              <button
                type="button"
                onClick={() =>
                  void onPatch({
                    postMeetingOutcome: "ready_to_close",
                    pipelineStatus: "negotiation",
                    meetingCompleted: true,
                    note: "Post-meeting: ready to close",
                  })
                }
                className="rounded-xl border border-premium-gold/50 px-3 py-2 text-xs font-semibold text-premium-gold"
              >
                Ready to close
              </button>
            </div>
            {lead.postMeetingOutcome ? (
              <p className="mt-2 text-xs text-[#737373]">
                Last outcome:{" "}
                <span className="text-white">{lead.postMeetingOutcome.replace(/_/g, " ")}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Collapsible objections */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#0B0B0B]/40">
          <button
            type="button"
            onClick={() => setObjectionsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-premium-gold"
          >
            Objection handling
            <span className="text-white">{objectionsOpen ? "−" : "+"}</span>
          </button>
          {objectionsOpen ? (
            <ul className="space-y-3 border-t border-white/10 px-4 py-4">
              {ASSISTANT_OBJECTIONS.map((o) => (
                <li key={o.id} className="rounded-xl border border-white/10 bg-[#121212] p-4">
                  <p className="font-semibold text-white">{o.objection}</p>
                  <p className="mt-2 text-sm text-premium-gold">
                    <span className="text-[10px] font-bold uppercase text-[#737373]">Short answer · </span>
                    {o.shortAnswer}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#B3B3B3]">
                    <span className="text-[10px] font-bold uppercase text-[#737373]">Call script · </span>
                    {o.fullScript}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Performance */}
        {stats ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#121212]/80 p-4">
            <p className="text-sm font-semibold text-premium-gold">Your performance (30 days)</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5 text-center text-sm">
              <div>
                <p className="text-2xl font-bold text-white">{stats.callsMade}</p>
                <p className="text-[10px] uppercase text-[#737373]">Calls started</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.whatsappSent}</p>
                <p className="text-[10px] uppercase text-[#737373]">WhatsApp</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.emailsSent}</p>
                <p className="text-[10px] uppercase text-[#737373]">Emails</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.meetingsBooked}</p>
                <p className="text-[10px] uppercase text-[#737373]">Meetings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.dealsClosed}</p>
                <p className="text-[10px] uppercase text-[#737373]">Deals closed</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Call mode modal */}
      {callMode ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#050505] px-4 py-6 text-white sm:px-8"
          role="dialog"
          aria-modal="true"
          aria-label="Call mode"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-premium-gold">Call mode</p>
              <button
                type="button"
                onClick={() => setCallMode(false)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-[#B3B3B3] hover:bg-white/5"
              >
                Exit
              </button>
            </div>
            <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">{script.title}</h2>
            <div className="mt-6 flex-1 overflow-y-auto rounded-2xl border border-premium-gold/25 bg-[#121212] p-6">
              <p className="text-lg font-semibold leading-relaxed text-white sm:text-xl">{script.opening}</p>
              <p className="mt-6 text-base leading-relaxed text-[#B3B3B3]">{script.questions}</p>
              <p className="mt-6 text-base leading-relaxed text-[#B3B3B3]">{script.valueStatement}</p>
              <p className="mt-6 text-lg font-medium text-premium-gold">{script.closingQuestion}</p>
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-bold uppercase text-[#737373]">Key questions</p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-base text-white">
                  {script.keyQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-bold uppercase text-[#737373]">Quick objections</p>
                <ul className="mt-3 space-y-3 text-sm text-[#B3B3B3]">
                  {ASSISTANT_OBJECTIONS.map((o) => (
                    <li key={o.id}>
                      <span className="font-semibold text-premium-gold">{o.objection}:</span> {o.shortAnswer}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={async () => {
                  await onPatch({ pipelineStatus: "contacted", recordFollowUp: true });
                  void logAssistantEvent(lead.id, "sales_call_started", { outcome: "marked_contacted" });
                  onReload();
                }}
                className="rounded-xl bg-premium-gold px-4 py-3 text-sm font-bold text-[#0B0B0B]"
              >
                Mark as contacted
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onPatch({ pipelineStatus: "qualified" });
                  onReload();
                }}
                className="rounded-xl border border-premium-gold/50 px-4 py-3 text-sm font-semibold text-premium-gold"
              >
                Mark qualified
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onPatch({ pipelineStatus: "negotiation" });
                  onReload();
                }}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white"
              >
                Move to negotiation
              </button>
              <button
                type="button"
                onClick={() => {
                  setCallMode(false);
                  document.getElementById("sales-meeting-helper")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white"
              >
                Schedule meeting
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onPatch({ pipelineStatus: "closing" });
                  onReload();
                }}
                className="rounded-xl border border-amber-500/50 px-4 py-3 text-sm font-semibold text-amber-200"
              >
                Move to closing
              </button>
              <button
                type="button"
                onClick={async () => {
                  setCallMode(false);
                  document.getElementById("close-deal-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
              >
                Mark won
              </button>
              <div className="flex w-full flex-col gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3 sm:w-auto">
                <label className="text-[10px] font-bold uppercase text-red-200">Mark lost (reason)</label>
                <select
                  value={callLostReason}
                  onChange={(e) => setCallLostReason(e.target.value)}
                  className="rounded-lg border border-white/15 bg-[#121212] px-2 py-2 text-sm text-white"
                >
                  <option value="price">Price</option>
                  <option value="timing">Timing</option>
                  <option value="no_response">No response</option>
                  <option value="competitor">Chose competitor</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Mark this lead as lost? This requires your confirmation.")) return;
                    await onPatch({ pipelineStatus: "lost", lostReason: callLostReason, dealOutcomeNotes: "Marked lost from call mode" });
                    onReload();
                    setCallMode(false);
                  }}
                  className="rounded-lg border border-red-400/60 px-3 py-2 text-xs font-bold text-red-200"
                >
                  Confirm mark lost
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
