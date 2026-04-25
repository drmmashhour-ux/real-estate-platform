"use client";

import { useEffect, useState } from "react";
import { QC_NOTARY_CHECKLIST_KEYS, QC_NOTARY_CHECKLIST_LABELS } from "@/modules/quebec-closing/quebec-closing.types";
import type { QcClosingApiBundle } from "./qc-closing-types";

export function NotaryChecklistPanel({
  dealId,
  bundle,
  onUpdated,
}: {
  dealId: string;
  bundle: QcClosingApiBundle;
  onUpdated: (b: QcClosingApiBundle) => void;
}) {
  const n = bundle.notary;
  const [name, setName] = useState(n?.notaryDisplayName ?? "");
  const [office, setOffice] = useState(n?.notaryOffice ?? "");
  const [email, setEmail] = useState(n?.notaryEmail ?? "");
  const [phone, setPhone] = useState(n?.notaryPhone ?? "");
  const [appointmentAt, setAppointmentAt] = useState(
    n?.appointmentAt ? n.appointmentAt.slice(0, 16) : "",
  );
  const [deedNotes, setDeedNotes] = useState(n?.deedReadinessNotes ?? "");
  const [signingChannel, setSigningChannel] = useState(n?.signingChannel ?? "");
  const [markPacket, setMarkPacket] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function checklistFromBundle() {
    const checklistState: Record<string, { status: string; notes: string }> = {};
    for (const row of bundle.notaryChecklist) {
      checklistState[row.itemKey] = { status: row.status, notes: row.notes ?? "" };
    }
    return checklistState;
  }

  const [checklist, setChecklist] = useState(() => checklistFromBundle());

  useEffect(() => {
    const n = bundle.notary;
    setName(n?.notaryDisplayName ?? "");
    setOffice(n?.notaryOffice ?? "");
    setEmail(n?.notaryEmail ?? "");
    setPhone(n?.notaryPhone ?? "");
    setAppointmentAt(n?.appointmentAt ? n.appointmentAt.slice(0, 16) : "");
    setDeedNotes(n?.deedReadinessNotes ?? "");
    setSigningChannel(n?.signingChannel ?? "");
    setChecklist(checklistFromBundle());
  }, [bundle.notary, bundle.notaryChecklist]);

  async function save() {
    setErr(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        notaryDisplayName: name || null,
        notaryOffice: office || null,
        notaryEmail: email || null,
        notaryPhone: phone || null,
        appointmentAt: appointmentAt ? new Date(appointmentAt).toISOString() : null,
        deedReadinessNotes: deedNotes || null,
        signingChannel: signingChannel.trim() || null,
        markPacketComplete: markPacket,
        checklist: Object.fromEntries(
          QC_NOTARY_CHECKLIST_KEYS.map((k) => [
            k,
            { status: checklist[k]?.status ?? "PENDING", notes: checklist[k]?.notes ?? "" },
          ]),
        ),
      };
      const res = await fetch(`/api/deals/${dealId}/closing/notary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onUpdated(data as QcClosingApiBundle);
      setMarkPacket(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-ds-text-secondary">
          Notary name
          <input className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-xs text-ds-text-secondary">
          Office / étude
          <input className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" value={office} onChange={(e) => setOffice(e.target.value)} />
        </label>
        <label className="block text-xs text-ds-text-secondary">
          Email
          <input className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-xs text-ds-text-secondary">
          Phone
          <input className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block text-xs text-ds-text-secondary sm:col-span-2">
          Scheduled signing (local)
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text"
            value={appointmentAt}
            onChange={(e) => setAppointmentAt(e.target.value)}
          />
        </label>
        <label className="block text-xs text-ds-text-secondary sm:col-span-2">
          Signing channel (notary)
          <select
            className="mt-1 w-full rounded border border-ds-border bg-black/40 px-2 py-1.5 text-ds-text"
            value={signingChannel}
            onChange={(e) => setSigningChannel(e.target.value)}
          >
            <option value="">— Select —</option>
            <option value="IN_PERSON">In person at étude</option>
            <option value="REMOTE_DIGITAL">Remote / digital (where permitted)</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ds-gold/90">Notarial checklist</p>
        <ul className="mt-2 space-y-2">
          {QC_NOTARY_CHECKLIST_KEYS.map((key) => (
            <li key={key} className="flex flex-wrap items-center gap-2 rounded border border-white/5 bg-black/25 px-2 py-2 text-xs">
              <span className="min-w-[10rem] text-ds-text-secondary">{QC_NOTARY_CHECKLIST_LABELS[key]}</span>
              <select
                className="rounded border border-ds-border bg-black/40 px-2 py-1 text-ds-text"
                value={checklist[key]?.status ?? "PENDING"}
                onChange={(e) => setChecklist((c) => ({ ...c, [key]: { ...c[key], status: e.target.value, notes: c[key]?.notes ?? "" } }))}
              >
                <option value="PENDING">Pending</option>
                <option value="RECEIVED">Received</option>
                <option value="WAIVED">Waived</option>
                <option value="NOT_APPLICABLE">N/A</option>
              </select>
              <input
                placeholder="Notes"
                className="min-w-[8rem] flex-1 rounded border border-ds-border bg-black/30 px-2 py-1 text-ds-text"
                value={checklist[key]?.notes ?? ""}
                onChange={(e) => setChecklist((c) => ({ ...c, [key]: { status: c[key]?.status ?? "PENDING", notes: e.target.value } }))}
              />
            </li>
          ))}
        </ul>
      </div>

      <label className="block text-xs text-ds-text-secondary">
        Deed readiness notes
        <textarea className="mt-1 w-full rounded border border-ds-border bg-black/30 px-2 py-1.5 text-ds-text" rows={2} value={deedNotes} onChange={(e) => setDeedNotes(e.target.value)} />
      </label>

      <label className="flex items-center gap-2 text-xs text-ds-text-secondary">
        <input type="checkbox" checked={markPacket} onChange={(e) => setMarkPacket(e.target.checked)} />
        Mark closing packet complete (broker attestation)
      </label>

      <button
        type="button"
        disabled={loading || !bundle.closing}
        className="rounded-lg bg-ds-gold/90 px-4 py-2 text-xs font-semibold text-black disabled:opacity-40"
        onClick={() => void save()}
      >
        Save notary & checklist
      </button>
    </div>
  );
}
