"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function formatCad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

const AUTOPILOT_REPLY_PREFILL = "lecipm_autopilot_reply_prefill";

type AutopilotSnapshot = {
  leadId: string;
  hot: boolean;
  followUpOverdue: boolean;
  followUpDueToday: boolean;
  openActions: Array<{
    id: string;
    title: string;
    actionType: string;
    status: string;
    draftMessage: string | null;
  }>;
};

type PlaybookRecRow = {
  playbookId: string;
  name: string;
  score: number;
  reason: string;
  allowed: boolean;
};

const DEAL_CONVERT_HELP: Record<string, string> = {
  lead_not_found: "Lead not found or you don’t have access.",
  listing_required_for_bnhub_deal: "Link a listing to this lead before converting.",
  registered_buyer_required: "The inquiry needs a registered buyer (customer with email) on file.",
  short_term_listing_only_in_v1: "This automated path is limited to BNHub short-term listings today.",
  listing_resolve_failed: "We couldn’t resolve the listing record for deal creation.",
  buyer_and_seller_same_party: "Buyer and seller can’t be the same party.",
  deal_create_failed: "Deal creation failed — check broker disclosure / logs.",
  convert_unavailable: "Conversion service unavailable.",
};

type LeadPayload = {
  lead: {
    id: string;
    status: string;
    source: string;
    priorityLabel: string;
    priorityScore: number;
    guestName: string | null;
    guestEmail: string | null;
    customer: { name: string | null; email: string | null } | null;
    listing: { id: string; title: string; listingCode: string; price: number } | null;
    threadId: string | null;
    nextFollowUpAt: string | null;
    lastContactAt: string | null;
  };
  messages: Array<{ id: string; body: string; senderRole: string; senderName: string | null; createdAt: string }>;
  notes: Array<{ id: string; body: string; createdAt: string }>;
  tags: Array<{ id: string; tag: string }>;
  latestInsight: {
    summary: string | null;
    suggestedReply: string | null;
    nextBestAction: string | null;
    intentScore: number | null;
    urgencyScore: number | null;
    confidenceScore: number | null;
  } | null;
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "visit_scheduled",
  "negotiating",
  "closed",
  "lost",
] as const;

export function BrokerCrmLeadDetailClient({ leadId }: { leadId: string }) {
  const [data, setData] = useState<LeadPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [tag, setTag] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [autopilotSnapshot, setAutopilotSnapshot] = useState<AutopilotSnapshot | null>(null);
  const [autopilotNext, setAutopilotNext] = useState<{ nextBestAction: string; reason: string } | null>(null);
  const pendingAutopilotActionId = useRef<string | null>(null);
  const prefillApplied = useRef(false);
  const conversionTracked = useRef(false);
  const [conversionOffer, setConversionOffer] = useState<
    | {
        ok: true;
        unlocked: boolean;
        listPriceCents: number;
        offerPriceCents: number;
        firstLeadEligible: boolean;
        firstLeadOfferApplied: boolean;
        quality: {
          qualityScore: number;
          qualityLabel: string;
          reasonLine: string;
          exclusiveAssignment: boolean;
        };
        copy: { tryLine: string; coach: string };
      }
    | { ok: false; message?: string }
    | null
  >(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [postPurchaseHint, setPostPurchaseHint] = useState(false);
  const [progressNote, setProgressNote] = useState<string | null>(null);
  const [visitRows, setVisitRows] = useState<{
    requests: Array<{
      id: string;
      status: string;
      requestedStart: string;
      requestedEnd: string;
      listing: { title: string } | null;
    }>;
    visits: Array<{
      id: string;
      status: string;
      startDateTime: string;
      endDateTime: string;
      listing: { title: string } | null;
    }>;
  } | null>(null);
  const [playbookRecs, setPlaybookRecs] = useState<PlaybookRecRow[] | null>(null);
  const [convertPrice, setConvertPrice] = useState("");
  const [convertBusy, setConvertBusy] = useState(false);
  const [convertNote, setConvertNote] = useState<string | null>(null);
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadRes, snapRes] = await Promise.all([
        fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}`, { credentials: "same-origin" }),
        fetch(`/api/broker-autopilot/leads/${encodeURIComponent(leadId)}/snapshot`, { credentials: "same-origin" }),
      ]);
      const j = (await leadRes.json()) as LeadPayload & { error?: string };
      if (!leadRes.ok) throw new Error(j.error ?? "Load failed");
      let snap: AutopilotSnapshot | null = null;
      if (snapRes.ok) {
        snap = (await snapRes.json()) as AutopilotSnapshot;
      }
      setData(j);
      setAutopilotSnapshot(snap);
      setFollowUp(toDatetimeLocalValue(j.lead.nextFollowUpAt));
      setReplyDraft(j.latestInsight?.suggestedReply ?? "");
    } catch (e) {
      setAutopilotSnapshot(null);
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    prefillApplied.current = false;
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}/conversion`, {
          credentials: "same-origin",
        });
        const j = (await res.json()) as Record<string, unknown>;
        if (cancelled) return;
        if (j.ok === true) {
          setConversionOffer({
            ok: true,
            unlocked: Boolean(j.unlocked),
            listPriceCents: Number(j.listPriceCents),
            offerPriceCents: Number(j.offerPriceCents),
            firstLeadEligible: Boolean(j.firstLeadEligible),
            firstLeadOfferApplied: Boolean(j.firstLeadOfferApplied),
            quality: j.quality as {
              qualityScore: number;
              qualityLabel: string;
              reasonLine: string;
              exclusiveAssignment: boolean;
            },
            copy: j.copy as { tryLine: string; coach: string },
          });
        } else {
          setConversionOffer({
            ok: false,
            message: typeof j.message === "string" ? j.message : undefined,
          });
        }
      } catch {
        if (!cancelled) setConversionOffer(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  useEffect(() => {
    if (conversionTracked.current || typeof window === "undefined") return;
    conversionTracked.current = true;
    void fetch("/api/broker/conversion/track", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "broker_conversion_detail_open", crmLeadId: leadId }),
    }).catch(() => {});
  }, [leadId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("leadUnlock") === "success") {
      setPostPurchaseHint(true);
      q.delete("leadUnlock");
      q.delete("marketplaceLeadId");
      const next =
        window.location.pathname + (q.toString() ? `?${q.toString()}` : "") + window.location.hash;
      window.history.replaceState({}, "", next);
    }
  }, [leadId]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}/visits`, {
          credentials: "same-origin",
        });
        const j = (await res.json()) as typeof visitRows;
        if (res.ok && j && typeof j === "object") setVisitRows(j);
      } catch {
        /* optional */
      }
    })();
  }, [leadId]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(
          `/api/broker-crm/leads/${encodeURIComponent(leadId)}/playbook-suggestions?withAssignment=1`,
          { credentials: "same-origin" }
        );
        const j = (await res.json()) as { recommendations?: PlaybookRecRow[] };
        if (res.ok && Array.isArray(j.recommendations)) setPlaybookRecs(j.recommendations);
        else setPlaybookRecs([]);
      } catch {
        setPlaybookRecs([]);
      }
    })();
  }, [leadId]);

  useEffect(() => {
    if (!data?.lead?.listing?.price) {
      setConvertPrice("");
      return;
    }
    const dollars = Math.max(1, Math.round(data.lead.listing.price / 100));
    setConvertPrice(String(dollars));
    setConvertNote(null);
    setCreatedDealId(null);
  }, [data?.lead?.listing?.id, data?.lead?.listing?.price]);

  useEffect(() => {
    if (loading || prefillApplied.current) return;
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(AUTOPILOT_REPLY_PREFILL) : null;
      if (!raw) return;
      const p = JSON.parse(raw) as { leadId: string; draft: string; actionId?: string };
      if (p.leadId !== leadId) return;
      prefillApplied.current = true;
      if (p.draft) setReplyDraft(p.draft);
      pendingAutopilotActionId.current = p.actionId ?? null;
      sessionStorage.removeItem(AUTOPILOT_REPLY_PREFILL);
    } catch {
      prefillApplied.current = true;
    }
  }, [leadId, loading]);

  async function post(path: string, body?: object) {
    const res = await fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(j.error ?? "Request failed");
    return j;
  }

  if (loading) return <p className="text-sm text-slate-500">Loading lead…</p>;
  if (error || !data) return <p className="text-sm text-red-400">{error ?? "Not found"}</p>;

  const { lead, messages, notes, tags, latestInsight } = data;
  const contactName = lead.customer?.name?.trim() || lead.guestName || "Lead";
  const contactEmail = lead.customer?.email || lead.guestEmail;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/crm" className="text-xs text-premium-gold hover:underline">
            ← Back to Inquiry CRM
          </Link>
          <h2 className="mt-2 text-2xl font-semibold text-white">{contactName}</h2>
          <p className="text-sm text-slate-400">{contactEmail ?? "—"}</p>
          <p className="mt-2 text-xs text-slate-500">
            Source: {lead.source} · Priority: {lead.priorityLabel} ({lead.priorityScore})
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs text-slate-500">Status</label>
          <select
            className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
            value={lead.status}
            disabled={!!busy}
            onChange={async (e) => {
              setBusy("status");
              try {
                await post("/status", { status: e.target.value });
                await load();
                if (e.target.value === "contacted") {
                  setProgressNote("You're making progress on this deal.");
                  void fetch("/api/broker/conversion/track", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      eventType: "broker_conversion_crm_view",
                      crmLeadId: leadId,
                    }),
                  }).catch(() => {});
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              } finally {
                setBusy(null);
              }
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {progressNote ? (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100">
          {progressNote}
          <button
            type="button"
            className="ml-3 text-xs text-emerald-300 underline"
            onClick={() => setProgressNote(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {postPurchaseHint ? (
        <div className="rounded-xl border border-premium-gold/35 bg-premium-gold/10 px-4 py-4">
          <p className="text-sm font-semibold text-white">Contact this lead now</p>
          <p className="mt-1 text-sm text-emerald-200/90">You’re ahead of most brokers on this deal when you follow up today.</p>
          <p className="mt-1 text-sm text-slate-200">
            Next: send a short introduction referencing the listing and offer two time options.
          </p>
          {latestInsight?.suggestedReply ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Suggested message</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{latestInsight.suggestedReply}</p>
            </div>
          ) : null}
          <button
            type="button"
            className="mt-3 text-xs text-premium-gold hover:underline"
            onClick={() => setPostPurchaseHint(false)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {conversionOffer?.ok === true && conversionOffer.unlocked ? (
        <p className="text-xs text-emerald-400/90">Full contact access is unlocked for this inquiry.</p>
      ) : null}

      {conversionOffer?.ok === true && !conversionOffer.unlocked ? (
        <section className="rounded-xl border border-premium-gold/25 bg-[#151515] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Try this lead</p>
              <p className="text-sm text-slate-100">{conversionOffer.copy.tryLine}</p>
              <p className="text-xs text-slate-500">{conversionOffer.copy.coach}</p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                <span className="rounded-full bg-white/10 px-2 py-0.5">
                  Quality {conversionOffer.quality.qualityLabel} ({conversionOffer.quality.qualityScore})
                </span>
                {conversionOffer.quality.exclusiveAssignment ? (
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-100">
                    Routed to you
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-300">{conversionOffer.quality.reasonLine}</p>
            </div>
            <div className="text-right">
              {conversionOffer.firstLeadOfferApplied ? (
                <p className="text-xs text-slate-500 line-through">
                  {formatCad(conversionOffer.listPriceCents)}
                </p>
              ) : null}
              <p className="text-lg font-semibold text-white">{formatCad(conversionOffer.offerPriceCents)}</p>
              {conversionOffer.firstLeadEligible ? (
                <p className="text-[11px] text-emerald-300/90">First-lead introductory rate</p>
              ) : null}
              <button
                type="button"
                disabled={unlockBusy}
                onClick={async () => {
                  setUnlockBusy(true);
                  try {
                    void fetch("/api/broker/conversion/track", {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        eventType: "broker_conversion_unlock_click",
                        crmLeadId: leadId,
                      }),
                    }).catch(() => {});
                    const res = await fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}/unlock-checkout`, {
                      method: "POST",
                      credentials: "same-origin",
                    });
                    const j = (await res.json()) as { url?: string; error?: string; softBlock?: boolean; message?: string };
                    if (!res.ok) throw new Error(j.message ?? j.error ?? "Checkout failed");
                    if (j.softBlock) throw new Error(j.message ?? "Unlock not available");
                    if (j.url) window.location.href = j.url;
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Checkout failed");
                  } finally {
                    setUnlockBusy(false);
                  }
                }}
                className="mt-3 w-full min-w-[160px] rounded-lg bg-premium-gold px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-40 sm:w-auto"
              >
                {unlockBusy ? "Starting checkout…" : `Unlock lead (${formatCad(conversionOffer.offerPriceCents)})`}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {conversionOffer?.ok === false && conversionOffer.message ? (
        <p className="text-xs text-slate-500">{conversionOffer.message}</p>
      ) : null}

      {lead.listing ? (
        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Listing</h3>
          <Link href={`/listings/${lead.listing.id}`} className="mt-1 text-premium-gold hover:underline">
            {lead.listing.title}
          </Link>
          <p className="text-xs text-slate-500">{lead.listing.listingCode}</p>
        </section>
      ) : null}

      {playbookRecs && playbookRecs.length > 0 ? (
        <section className="rounded-xl border border-violet-500/25 bg-violet-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-violet-100">Playbook suggestions</h3>
            <p className="text-[10px] text-slate-500">
              From playbook-memory retrieval ·{" "}
              <Link href="/dashboard/crm/autopilot" className="text-violet-300 hover:underline">
                review queue
              </Link>
            </p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {playbookRecs.map((r) => (
              <li
                key={r.playbookId}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs sm:text-sm"
              >
                <span className="font-medium text-white">{r.name}</span>{" "}
                <span className="text-slate-500">(score {Number(r.score).toFixed(2)})</span>{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    r.allowed ? "bg-emerald-500/20 text-emerald-100" : "bg-slate-600/40 text-slate-300"
                  }`}
                >
                  {r.allowed ? "Allowed" : "Blocked by policy"}
                </span>
                <p className="mt-1 text-slate-400">{r.reason}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            Playbook suggestions load with an auditable assignment row for the learning loop (withAssignment=1). Still suggest-only — no auto-messages or execution.
          </p>
        </section>
      ) : playbookRecs && playbookRecs.length === 0 ? (
        <section className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
          No playbook recommendations for this lead yet (memory loop returned empty).
        </section>
      ) : null}

      {lead.listing ? (
        <section className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4">
          <h3 className="text-sm font-semibold text-emerald-100">Create deal from lead</h3>
          <p className="mt-1 text-xs text-slate-400">
            Uses <code className="text-slate-500">POST /api/crm/convert-to-deal</code> — BNHub short-term listing + registered
            buyer required. Broker disclosure checks apply. No auto-messages.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-500">
              Offer price (CAD, dollars)
              <input
                type="number"
                min={1}
                className="mt-1 block w-40 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                value={convertPrice}
                onChange={(e) => setConvertPrice(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={convertBusy || !convertPrice}
              onClick={async () => {
                setConvertBusy(true);
                setConvertNote(null);
                setCreatedDealId(null);
                try {
                  const priceDollars = Math.max(1, Number(convertPrice) || 0);
                  const res = await fetch("/api/crm/convert-to-deal", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ leadId, priceDollars }),
                  });
                  const j = (await res.json()) as {
                    ok?: boolean;
                    dealId?: string;
                    reason?: string;
                    error?: string;
                  };
                  if (j.ok && j.dealId) {
                    setCreatedDealId(j.dealId);
                    setConvertNote("Deal created or linked. Lead stage updated to negotiating when applicable.");
                    await load();
                  } else {
                    const reason = j.reason ?? j.error ?? "unknown";
                    setConvertNote(DEAL_CONVERT_HELP[reason] ?? reason);
                  }
                } catch {
                  setConvertNote("Request failed.");
                } finally {
                  setConvertBusy(false);
                }
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {convertBusy ? "Working…" : "Convert to deal"}
            </button>
          </div>
          {convertNote ? <p className="mt-2 text-xs text-slate-300">{convertNote}</p> : null}
          {createdDealId ? (
            <p className="mt-2 text-sm">
              <Link href={`/dashboard/deals/${createdDealId}/playbook`} className="text-premium-gold hover:underline">
                Open deal playbook →
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-cyan-100">AI insight</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("ai-sum");
                try {
                  await post("/ai-summary");
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="rounded-lg bg-cyan-600/30 px-3 py-1.5 text-xs font-medium text-cyan-50 hover:bg-cyan-600/50"
            >
              Summarize conversation
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("ai-next");
                try {
                  await post("/next-action");
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
            >
              Next best action
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("ai-reply");
                try {
                  const res = await fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}/ai-reply`, {
                    method: "POST",
                    credentials: "same-origin",
                  });
                  const j = (await res.json()) as { draft?: string; error?: string };
                  if (!res.ok) throw new Error(j.error ?? "Failed");
                  if (j.draft) setReplyDraft(j.draft);
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
            >
              Generate reply
            </button>
          </div>
        </div>
        {latestInsight?.summary ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{latestInsight.summary}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No summary yet — generate one from the conversation.</p>
        )}
        {latestInsight?.nextBestAction ? (
          <p className="mt-2 text-sm text-amber-100/90">
            <span className="font-medium">Next:</span> {latestInsight.nextBestAction}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
          <span>Intent {latestInsight?.intentScore ?? "—"}</span>
          <span>Urgency {latestInsight?.urgencyScore ?? "—"}</span>
          <span>Confidence {latestInsight?.confidenceScore ?? "—"}</span>
        </div>
      </section>

      {autopilotSnapshot ? (
        <section className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-100">CRM Autopilot</h3>
            <Link href="/dashboard/crm/autopilot" className="text-xs text-amber-200/90 hover:underline">
              Queue &amp; settings →
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {autopilotSnapshot.hot ? (
              <span className="rounded-full bg-rose-500/25 px-2 py-0.5 font-medium text-rose-100">Hot lead</span>
            ) : (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300">Steady</span>
            )}
            {autopilotSnapshot.followUpOverdue ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-100">Follow up overdue</span>
            ) : null}
            {autopilotSnapshot.followUpDueToday && !autopilotSnapshot.followUpOverdue ? (
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-100">Follow up due today</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("ap-draft");
                try {
                  const res = await fetch(`/api/broker-autopilot/leads/${encodeURIComponent(leadId)}/followup-draft`, {
                    method: "POST",
                    credentials: "same-origin",
                  });
                  const j = (await res.json()) as { draft?: string; error?: string };
                  if (!res.ok) throw new Error(j.error ?? "Failed");
                  if (j.draft) {
                    setReplyDraft(j.draft);
                    pendingAutopilotActionId.current = null;
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
            >
              AI follow-up draft
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("ap-next");
                try {
                  const res = await fetch(`/api/broker-autopilot/leads/${encodeURIComponent(leadId)}/next-action`, {
                    method: "POST",
                    credentials: "same-origin",
                  });
                  const j = (await res.json()) as {
                    nextBestAction?: string;
                    reason?: string;
                    error?: string;
                  };
                  if (!res.ok) throw new Error(j.error ?? "Failed");
                  if (j.nextBestAction && j.reason) {
                    setAutopilotNext({ nextBestAction: j.nextBestAction, reason: j.reason });
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/5"
            >
              Next best action (AI)
            </button>
          </div>
          {autopilotNext ? (
            <p className="mt-3 text-sm text-slate-200">
              <span className="font-medium text-amber-100/90">Next:</span> {autopilotNext.nextBestAction}
              <span className="mt-1 block text-xs text-slate-500">{autopilotNext.reason}</span>
            </p>
          ) : null}
          {autopilotSnapshot.openActions.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {autopilotSnapshot.openActions.map((a) => (
                <li key={a.id} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm">
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="text-[10px] uppercase text-slate-500">
                    {a.actionType} · {a.status}
                  </p>
                  {a.draftMessage ? (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">Draft: {a.draftMessage}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.status === "suggested" ? (
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={async () => {
                          setBusy(a.id);
                          try {
                            const res = await fetch(`/api/broker-autopilot/actions/${encodeURIComponent(a.id)}/approve`, {
                              method: "POST",
                              credentials: "same-origin",
                            });
                            const j = (await res.json()) as { error?: string };
                            if (!res.ok) throw new Error(j.error ?? "Approve failed");
                            await load();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          } finally {
                            setBusy(null);
                          }
                        }}
                        className="rounded bg-emerald-600/80 px-2 py-1 text-[11px] font-medium text-white"
                      >
                        Approve
                      </button>
                    ) : null}
                    {(a.status === "approved" || a.status === "queued") && lead.threadId ? (
                      <button
                        type="button"
                        disabled={busy === `ex-${a.id}`}
                        onClick={async () => {
                          setBusy(`ex-${a.id}`);
                          try {
                            const res = await fetch(`/api/broker-autopilot/actions/${encodeURIComponent(a.id)}/execute`, {
                              method: "POST",
                              credentials: "same-origin",
                            });
                            const j = (await res.json()) as { draftMessage?: string; error?: string };
                            if (!res.ok) throw new Error(j.error ?? "Failed");
                            if (typeof j.draftMessage === "string") setReplyDraft(j.draftMessage);
                            pendingAutopilotActionId.current = a.id;
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed");
                          } finally {
                            setBusy(null);
                          }
                        }}
                        className="rounded bg-premium-gold px-2 py-1 text-[11px] font-semibold text-black"
                      >
                        Load draft to send
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No open autopilot actions for this lead.</p>
          )}
          <p className="mt-3 text-[10px] text-slate-600">
            AI-generated text is labeled in APIs; edit every draft before sending.
          </p>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white">Conversation</h3>
          <ul className="mt-3 max-h-[360px] space-y-3 overflow-y-auto text-sm">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
                <p className="text-[10px] uppercase text-slate-500">
                  {m.senderRole} {m.senderName ? `· ${m.senderName}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-200">{m.body}</p>
                <p className="mt-1 text-[10px] text-slate-600">{new Date(m.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white">Reply (edit before sending)</h3>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder="Generate a draft or write your own…"
            />
            <button
              type="button"
              disabled={!!busy || !replyDraft.trim() || !lead.threadId}
              onClick={async () => {
                setBusy("send");
                try {
                  const res = await fetch(`/api/broker-crm/leads/${encodeURIComponent(leadId)}/send-message`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      body: replyDraft.trim(),
                      fromAiDraft: true,
                      ...(pendingAutopilotActionId.current
                        ? { autopilotActionId: pendingAutopilotActionId.current }
                        : {}),
                    }),
                  });
                  const j = (await res.json()) as { error?: string };
                  if (!res.ok) throw new Error(j.error ?? "Failed");
                  setReplyDraft("");
                  pendingAutopilotActionId.current = null;
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="mt-2 rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              Send message
            </button>
            {!lead.threadId ? <p className="mt-2 text-xs text-amber-200/90">No thread linked.</p> : null}
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white">Follow-up</h3>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
            />
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("fu");
                try {
                  await post("/follow-up", {
                    nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null,
                  });
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="mt-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
            >
              Save follow-up
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Notes</h3>
        <div className="mt-2 flex gap-2">
          <textarea
            className="min-h-[72px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Add a note…"
          />
          <button
            type="button"
            disabled={!!busy || !noteBody.trim()}
            onClick={async () => {
              setBusy("note");
              try {
                await post("/notes", { body: noteBody.trim() });
                setNoteBody("");
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              } finally {
                setBusy(null);
              }
            }}
            className="self-end rounded-lg bg-white/10 px-4 py-2 text-sm"
          >
            Save
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {notes.map((n) => (
            <li key={n.id} className="border-l-2 border-premium-gold/40 pl-3">
              {n.body}
              <span className="ml-2 text-[10px] text-slate-600">{new Date(n.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Tags</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.id} className="rounded-full bg-white/10 px-3 py-1 text-xs">
              {t.tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="investor, urgent, visit requested…"
          />
          <button
            type="button"
            disabled={!!busy || !tag.trim()}
            onClick={async () => {
              setBusy("tag");
              try {
                await post("/tags", { tag: tag.trim() });
                setTag("");
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm"
          >
            Add tag
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={async () => {
            setBusy("score");
            try {
              await post("/score");
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            } finally {
              setBusy(null);
            }
          }}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200"
        >
          Recalculate priority
        </button>
      </div>
    </div>
  );
}
