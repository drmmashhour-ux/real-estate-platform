"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";

type MortgageDealRow = {
  id: string;
  dealAmount: number;
  platformShare: number;
  expertShare: number;
  status: string;
} | null;

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  pipelineStatus: string;
  score: number;
  createdAt: string;
  mortgageInquiry: unknown;
  highIntent: boolean;
  revenueTier: string | null;
  mortgageCreditCost: number;
  estimatedValue: number | null;
  conversionProbability: number | null;
  purchaseRegion: string | null;
  lastContactedAt: string | null;
  mortgageAssignedAt: string | null;
  mortgageDeal: MortgageDealRow;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In progress" },
  { value: "lost", label: "Lost" },
] as const;

export function ExpertLeadsClient() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [err, setErr] = useState("");
  const [closeFor, setCloseFor] = useState<LeadRow | null>(null);
  const [dealAmount, setDealAmount] = useState("");
  const [closeErr, setCloseErr] = useState("");
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/mortgage/expert/leads", { credentials: "same-origin" });
    if (!res.ok) {
      setErr("Could not load leads.");
      return;
    }
    const j = (await res.json()) as { leads: LeadRow[] };
    setLeads(j.leads);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const trackContact = async (leadId: string, channel: "call" | "whatsapp" | "email") => {
    await fetch(`/api/mortgage/expert/leads/${leadId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ channel }),
    });
    void load();
  };

  async function updateStatus(leadId: string, pipelineStatus: string) {
    const res = await fetch(`/api/mortgage/expert/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ pipelineStatus }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      alert(j.error ?? "Could not update status");
      return;
    }
    void load();
  }

  async function submitCloseDeal() {
    if (!closeFor) return;
    setCloseErr("");
    const amt = Math.round(Number.parseFloat(dealAmount.replace(/,/g, "")));
    if (!Number.isFinite(amt) || amt <= 0) {
      setCloseErr("Enter a valid deal amount (whole dollars).");
      return;
    }
    setClosing(true);
    try {
      const res = await fetch(`/api/mortgage/expert/leads/${closeFor.id}/close-deal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ dealAmount: amt, confirmed: true }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCloseErr(j.error ?? "Could not record deal");
        return;
      }
      setCloseFor(null);
      setDealAmount("");
      void load();
    } finally {
      setClosing(false);
    }
  }

  if (err) return <p className="mt-8 text-red-400">{err}</p>;
  if (!leads) return <p className="mt-8 text-[#B3B3B3]">Loading…</p>;
  if (leads.length === 0) {
    return <p className="mt-8 text-[#737373]">No leads yet. Share the /mortgage page with clients.</p>;
  }

  return (
    <>
      <ul className="mt-8 space-y-4">
        {leads.map((l) => {
          const fallbackWa = getContactWhatsAppUrl(
            `Hi ${l.name.split(/\s+/)[0] || ""} — following up on your mortgage inquiry with LECIPM.`
          );
          const digits = l.phone.replace(/\D/g, "");
          const e164 = digits.length >= 10 ? (digits.startsWith("1") ? digits : `1${digits}`) : "";
          const clientWa = e164
            ? `https://wa.me/${e164}?text=${encodeURIComponent("Hi — following up on your mortgage request with LECIPM.")}`
            : fallbackWa;

          const isClosed = l.pipelineStatus === "closed" || Boolean(l.mortgageDeal);
          const inq = l.mortgageInquiry as Record<string, unknown> | null;
          const telClientClean =
            l.phone && l.phone !== "—"
              ? `tel:${l.phone.replace(/[^\d+]/g, "")}`
              : null;
          const mailHref = `mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent("Re: your mortgage request")}`;
          const assignedAtMs = l.mortgageAssignedAt ? new Date(l.mortgageAssignedAt).getTime() : 0;
          const needsFastResponse =
            !isClosed &&
            l.pipelineStatus === "new" &&
            !l.lastContactedAt &&
            assignedAtMs > 0 &&
            Date.now() - assignedAtMs > 2 * 3600 * 1000;

          return (
            <li key={l.id} className="rounded-2xl border border-white/10 bg-[#121212] p-5 text-sm">
              {needsFastResponse ? (
                <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <strong>Fast response:</strong> client is waiting — contact now to protect conversion (and your routing
                  score).
                </p>
              ) : null}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">{l.name}</p>
                  <p className="text-[#B3B3B3]">{l.email}</p>
                  <p className="text-[#737373]">{l.phone}</p>
                  {l.revenueTier || l.purchaseRegion != null ? (
                    <p className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                      {l.revenueTier ? (
                        <span className="rounded border border-premium-gold/50 px-2 py-0.5 text-premium-gold">
                          Tier {l.revenueTier}
                        </span>
                      ) : null}
                      {l.purchaseRegion ? (
                        <span className="rounded border border-white/20 px-2 py-0.5 text-[#9CA3AF]">{l.purchaseRegion}</span>
                      ) : null}
                      {l.estimatedValue != null && l.estimatedValue > 0 ? (
                        <span className="text-[#9CA3AF]">
                          Est. value ${l.estimatedValue.toLocaleString()} · Win prob ~
                          {((l.conversionProbability ?? 0) * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {inq && (inq.purchasePrice != null || inq.downPayment != null) ? (
                    <p className="mt-2 text-xs text-[#9CA3AF]">
                      {inq.purchasePrice != null ? <>Price (est.): ${Number(inq.purchasePrice).toLocaleString()} · </> : null}
                      {inq.downPayment != null ? <>Down: ${Number(inq.downPayment).toLocaleString()}</> : null}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs uppercase tracking-wider text-premium-gold">
                    Status: {l.pipelineStatus}
                    {l.highIntent ? " · High intent" : ""}
                    {l.mortgageCreditCost > 0 ? ` · Charged ${l.mortgageCreditCost} credits` : ""}
                  </p>
                  {l.mortgageDeal ? (
                    <p className="mt-2 text-xs text-emerald-300/90">
                      Deal recorded: ${l.mortgageDeal.dealAmount.toLocaleString()} · Platform{" "}
                      ${l.mortgageDeal.platformShare.toLocaleString()} · Expert $
                      {l.mortgageDeal.expertShare.toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <label className="flex flex-col gap-1 text-xs text-[#737373]">
                    Update stage
                    <select
                      disabled={isClosed}
                      value={
                        isClosed
                          ? "closed"
                          : STATUS_OPTIONS.some((o) => o.value === l.pipelineStatus)
                            ? l.pipelineStatus
                            : "new"
                      }
                      onChange={(e) => void updateStatus(l.id, e.target.value)}
                      className="rounded-lg border border-white/20 bg-[#0B0B0B] px-2 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {isClosed ? (
                        <option value="closed">Closed</option>
                      ) : (
                        STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {telClientClean ? (
                      <a
                        href={telClientClean}
                        onClick={() => void trackContact(l.id, "call")}
                        className="rounded-lg border border-emerald-500/50 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Call client now
                      </a>
                    ) : null}
                    <a
                      href={mailHref}
                      onClick={() => void trackContact(l.id, "email")}
                      className="rounded-lg border border-sky-500/40 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/10"
                    >
                      Email client
                    </a>
                    <a
                      href={getBrokerTelHref()}
                      onClick={() => void trackContact(l.id, "call")}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5"
                    >
                      Log call (broker line)
                    </a>
                    <a
                      href={clientWa}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => void trackContact(l.id, "whatsapp")}
                      className="rounded-lg border border-premium-gold/50 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10"
                      title="Opens WhatsApp — marks contacted when clicked from dashboard"
                    >
                      WhatsApp client
                    </a>
                    {!isClosed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCloseFor(l);
                          setDealAmount("");
                          setCloseErr("");
                        }}
                        className="rounded-lg border border-emerald-500/50 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Record closed deal
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-xs text-[#9CA3AF]">
                {l.message}
              </pre>
            </li>
          );
        })}
      </ul>

      {closeFor ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="close-deal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <h2 id="close-deal-title" className="text-lg font-bold text-premium-gold">
              Confirm closed deal
            </h2>
            <p className="mt-2 text-xs text-[#B3B3B3]">
              Enter the final financed deal amount (whole dollars). Platform commission defaults to 30% of this amount
              (see your agreement).
            </p>
            {closeErr ? <p className="mt-2 text-sm text-red-400">{closeErr}</p> : null}
            <label className="mt-4 block text-xs font-semibold text-premium-gold/90">
              Deal amount ($)
              <input
                type="text"
                inputMode="numeric"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
                placeholder="e.g. 450000"
              />
            </label>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={closing}
                onClick={() => void submitCloseDeal()}
                className="flex-1 rounded-xl bg-premium-gold py-2.5 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
              >
                {closing ? "Saving…" : "Confirm deal closed"}
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={() => setCloseFor(null)}
                className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
