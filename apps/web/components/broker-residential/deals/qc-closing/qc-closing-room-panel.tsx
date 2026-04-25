"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdjustmentsPanel } from "./adjustments-panel";
import { ClosingTimeline } from "./closing-timeline";
import { ConditionDeadlinePanel } from "./condition-deadline-panel";
import { NotaryChecklistPanel } from "./notary-checklist-panel";
import type { QcClosingApiBundle } from "./qc-closing-types";

export function QcClosingRoomPanel({
  dealId,
  pipelineClosingHref,
}: {
  dealId: string;
  /** Dashboard pipeline closing room to initialize secure session when missing */
  pipelineClosingHref: string;
}) {
  const [bundle, setBundle] = useState<QcClosingApiBundle | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch(`/api/deals/${dealId}/closing`);
    const data = await res.json();
    if (!res.ok) {
      setLoadErr(typeof data.error === "string" ? data.error : "Could not load closing");
      setBundle(null);
      return;
    }
    setBundle(data as QcClosingApiBundle);
  }, [dealId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function postSigningReady() {
    setActionErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/closing/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not ready");
      setBundle(data as QcClosingApiBundle);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function postComplete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const deedSignedAt = String(fd.get("deedSignedAt") ?? "");
    const landRegisterStatus = String(fd.get("landRegisterStatus") ?? "");
    const deedActNumber = String(fd.get("deedActNumber") ?? "") || null;
    const deedPublicationReference = String(fd.get("deedPublicationReference") ?? "") || null;
    const releaseKeys = fd.get("releaseKeys") === "on";
    try {
      const res = await fetch(`/api/deals/${dealId}/closing/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deedSignedAt: deedSignedAt ? new Date(deedSignedAt).toISOString() : "",
          landRegisterStatus,
          deedActNumber,
          deedPublicationReference,
          releaseKeys,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Complete failed");
      setBundle(data as QcClosingApiBundle);
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) {
    return (
      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Québec closing room</h3>
        <p className="mt-2 text-sm text-red-400">{loadErr}</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          If the closing pipeline feature is disabled in this environment, enable `closingPipelineV1` or use a staging build.
        </p>
      </section>
    );
  }

  if (!bundle) {
    return (
      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <p className="text-sm text-ds-text-secondary">Loading Québec closing…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-ds-text">Québec closing room</h3>
          <p className="mt-1 text-xs text-ds-text-secondary">
            Notarial sequence: offer → conditions → notary → signing → deed → land register → keys. CRM close requires deed data and register confirmation (or N/A).
          </p>
        </div>
        <Link href={pipelineClosingHref} className="text-xs text-ds-gold hover:text-amber-200">
          Pipeline closing console →
        </Link>
      </div>

      {!bundle.closing ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          <p>No closing session on this deal yet. Initialize the secure closing room from the pipeline, then return here.</p>
          <Link className="mt-2 inline-block text-ds-gold" href={pipelineClosingHref}>
            Open pipeline closing →
          </Link>
        </div>
      ) : null}

      {actionErr ? <p className="mt-3 text-sm text-red-400">{actionErr}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Timeline</h4>
          <ClosingTimeline currentStage={bundle.closing?.qcClosingStage} />
          <div className="mt-4 space-y-1 text-[11px] text-ds-text-secondary">
            <p>
              Readiness: <span className="text-ds-text">{bundle.readiness.readinessStatus}</span> · Packet:{" "}
              <span className="text-ds-text">{bundle.flags.packetMarkedComplete ? "marked complete" : "open"}</span>
            </p>
            {bundle.signingReadinessBlockers.length > 0 ? (
              <div>
                <span className="font-semibold text-amber-400">Signing gate:</span>
                <ul className="list-inside list-disc">
                  {bundle.signingReadinessBlockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {bundle.deedCompletionBlockers.length > 0 ? (
              <div>
                <span className="font-semibold text-amber-400">Deed / register gate:</span>
                <ul className="list-inside list-disc">
                  {bundle.deedCompletionBlockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Closing packet index</h4>
          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs">
            {bundle.closingPacket.sections.map((s) => (
              <li key={s.key} className="flex justify-between gap-2 rounded border border-white/5 bg-black/20 px-2 py-1">
                <span>{s.label}</span>
                <span className="shrink-0 text-ds-text-secondary">{s.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] text-ds-text-secondary">Generated {bundle.closingPacket.generatedAt}</p>
        </div>
      </div>

      <div className="mt-8 space-y-8 border-t border-ds-border pt-8">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Conditions & deadlines</h4>
          <ConditionDeadlinePanel dealId={dealId} bundle={bundle} onUpdated={setBundle} />
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Notary coordination & checklist</h4>
          <NotaryChecklistPanel dealId={dealId} bundle={bundle} onUpdated={setBundle} />
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Adjustments (statement of adjustments)</h4>
          <AdjustmentsPanel dealId={dealId} bundle={bundle} onUpdated={setBundle} />
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Fund flow (deposit & disbursement)</h4>
          <p className="mt-1 text-xs text-ds-text-secondary">
            Tracks `LecipmDealPayment` rows on the deal (deposit, balance, trust release). Broker records funding milestones; notary coordinates final disbursement.
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {bundle.fundFlow.rows.length === 0 ? (
              <li className="text-ds-text-secondary">No payment rows yet.</li>
            ) : (
              bundle.fundFlow.rows.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 rounded border border-white/5 bg-black/20 px-2 py-1">
                  <span>
                    {p.paymentKind} · {p.status}
                  </span>
                  <span className="font-mono text-ds-text-secondary">
                    {(p.amountCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-4 border-t border-ds-border pt-8 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Signing readiness</h4>
          <p className="mt-1 text-xs text-ds-text-secondary">Advances stage to SIGNING_READY when pre-closing validation passes (conditions, packet, signatures).</p>
          <button
            type="button"
            disabled={busy || !bundle.closing}
            className="mt-3 rounded-lg bg-emerald-600/90 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            onClick={() => void postSigningReady()}
          >
            Mark signing ready
          </button>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Deed & registration</h4>
          <p className="mt-1 text-xs text-ds-text-secondary">
            Keys release only after CLOSED. Use land register PENDING when inscription is not yet confirmed; complete again with CONFIRMED to close the file.
          </p>
          <form className="mt-3 space-y-2 text-xs" onSubmit={(e) => void postComplete(e)}>
            <label className="block text-ds-text-secondary">
              Deed signed at
              <input type="datetime-local" name="deedSignedAt" required className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1 text-ds-text" />
            </label>
            <label className="block text-ds-text-secondary">
              Land register
              <select name="landRegisterStatus" required className="mt-1 w-full rounded border border-ds-border bg-black/40 px-2 py-1 text-ds-text">
                <option value="PENDING">Pending inscription</option>
                <option value="CONFIRMED">Confirmed / published</option>
                <option value="NOT_APPLICABLE">Not applicable</option>
              </select>
            </label>
            <label className="block text-ds-text-secondary">
              Act / minute number
              <input name="deedActNumber" className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1 text-ds-text" />
            </label>
            <label className="block text-ds-text-secondary">
              Publication reference
              <input name="deedPublicationReference" className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1 text-ds-text" />
            </label>
            <label className="flex items-center gap-2 text-ds-text-secondary">
              <input type="checkbox" name="releaseKeys" />
              Release keys (after closed)
            </label>
            <button
              type="submit"
              disabled={busy || !bundle.closing}
              className="rounded-lg border border-ds-gold/50 px-3 py-1.5 font-semibold text-ds-gold disabled:opacity-40"
            >
              Record deed / advance closing
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 border-t border-ds-border pt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Audit (recent)</h4>
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[10px] text-ds-text-secondary">
          {bundle.coordinationAudits.slice(0, 12).map((a) => (
            <li key={a.id}>
              {a.createdAt?.slice(0, 19)} · {a.action}
            </li>
          ))}
          {bundle.closingAudits.slice(0, 8).map((a) => (
            <li key={a.id}>
              {a.createdAt?.slice(0, 19)} · {a.eventType}: {a.note ?? ""}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-ds-text-secondary">
          Full history remains in coordination and closing audit tables — LECIPM traceability for OACIQ oversight.
        </p>
      </div>
    </section>
  );
}
