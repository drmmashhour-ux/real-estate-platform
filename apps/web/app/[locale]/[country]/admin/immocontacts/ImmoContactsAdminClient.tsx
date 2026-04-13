"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LegalPacketLink } from "@/components/admin/LegalPacketLink";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  listingId: string | null;
  listingCode: string | null;
  createdAt: string;
  firstPlatformContactAt: string | null;
  commissionEligible: boolean;
  commissionSource: string | null;
  userId: string | null;
  introducedByBrokerId: string | null;
  platformConversationId: string | null;
  deal: {
    id: string;
    status: string;
    possibleBypassFlag: boolean;
    commissionSource: string | null;
  } | null;
  introducedByBroker: { id: string; name: string | null; email: string } | null;
  activeRestriction?: string | null;
  recentLogs: Array<{
    id: string;
    eventType: string;
    actionType: string | null;
    reasonCode: string | null;
    note: string | null;
    adminNote: string | null;
    hub: string | null;
    actionAt: string;
  }>;
};

const ACTIONS = [
  { id: "HOLD_CONTACT", label: "Hold contact" },
  { id: "RELEASE_CONTACT_HOLD", label: "Release hold" },
  { id: "BLOCK_BUYER", label: "Block buyer" },
  { id: "UNBLOCK_BUYER", label: "Unblock buyer" },
  { id: "RESTRICT_BROKER", label: "Restrict broker" },
  { id: "RESTORE_BROKER", label: "Restore broker" },
  { id: "ARCHIVE_THREAD", label: "Archive thread" },
  { id: "ESCALATE_LEGAL_REVIEW", label: "Escalate legal review" },
] as const;

export function ImmoContactsAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [dealId, setDealId] = useState("");
  const [leadIdInput, setLeadIdInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionDraft, setActionDraft] = useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [restrictionFilter, setRestrictionFilter] = useState<"all" | "restricted" | "open">("all");
  const [dealFilter, setDealFilter] = useState<"all" | "bypass" | "linked" | "unlinked">("all");
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [logNoteDraft, setLogNoteDraft] = useState<Record<string, string>>({});
  const [savingLogId, setSavingLogId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    const r = await fetch("/api/admin/immocontacts", { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(typeof j.error === "string" ? j.error : "Failed to load");
      return;
    }
    setRows(Array.isArray(j.leads) ? j.leads : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const linkDeal = async () => {
    const d = dealId.trim();
    const l = leadIdInput.trim();
    if (!d) return;
    setBusy("__manual__");
    try {
      const r = await fetch(`/api/admin/deals/${encodeURIComponent(d)}/lead-link`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: l || null }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(typeof j.error === "string" ? j.error : "Failed");
        return;
      }
      setDealId("");
      setLeadIdInput("");
      await load();
    } finally {
      setBusy(null);
    }
  };

  const applyAction = async (leadId: string) => {
    const actionType = (actionDraft[leadId] ?? "").trim();
    const reasonCode = (reasonDraft[leadId] ?? "").trim();
    const note = (noteDraft[leadId] ?? "").trim();
    if (!actionType || !reasonCode || !note) {
      alert("Select an action, add a reason code, and enter an admin note.");
      return;
    }
    setBusy(leadId);
    try {
      const r = await fetch("/api/admin/immocontacts/actions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, actionType, reasonCode, note }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(typeof j.error === "string" ? j.error : "Failed");
        return;
      }
      setActionDraft((m) => ({ ...m, [leadId]: "" }));
      setReasonDraft((m) => ({ ...m, [leadId]: "" }));
      setNoteDraft((m) => ({ ...m, [leadId]: "" }));
      await load();
    } finally {
      setBusy(null);
    }
  };

  const buildEvidenceText = (row: Row) => {
    return [
      `ImmoContact lead: ${row.id}`,
      `Name: ${row.name}`,
      `Email: ${row.email || "—"}`,
      `Phone: ${row.phone || "—"}`,
      `Listing: ${row.listingCode || row.listingId || "—"}`,
      `Broker: ${row.introducedByBroker?.name || row.introducedByBroker?.email || "—"}`,
      `First contact: ${new Date(row.firstPlatformContactAt ?? row.createdAt).toLocaleString()}`,
      `Active restriction: ${row.activeRestriction || "None"}`,
      `Deal: ${row.deal ? `${row.deal.id} (${row.deal.status})` : "None"}`,
      `Possible bypass: ${row.deal?.possibleBypassFlag ? "Yes" : "No"}`,
      "",
      "Recent evidence trail:",
      ...(row.recentLogs.length === 0
        ? ["No related audit events yet."]
        : row.recentLogs.map((log, index) =>
            [
              `${index + 1}. ${new Date(log.actionAt).toLocaleString()} | ${log.eventType}${log.actionType ? ` | ${log.actionType}` : ""}`,
              `   Note: ${log.note || "No event note"}`,
              `   Reason code: ${log.reasonCode || "—"}`,
              `   Admin note: ${log.adminNote || "—"}`,
              `   Hub: ${log.hub || "unknown"}`,
            ].join("\n")
          )),
    ].join("\n");
  };

  const buildLegalPacket = (row: Row) => {
    return {
      generatedAt: new Date().toISOString(),
      source: "ImmoContact admin legal packet",
      lead: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        userId: row.userId,
        firstPlatformContactAt: row.firstPlatformContactAt ?? row.createdAt,
        createdAt: row.createdAt,
      },
      listing: {
        listingId: row.listingId,
        listingCode: row.listingCode,
      },
      broker: {
        brokerId: row.introducedByBrokerId,
        name: row.introducedByBroker?.name ?? null,
        email: row.introducedByBroker?.email ?? null,
      },
      commission: {
        eligible: row.commissionEligible,
        source: row.commissionSource,
      },
      conversation: {
        platformConversationId: row.platformConversationId,
      },
      deal: row.deal
        ? {
            id: row.deal.id,
            status: row.deal.status,
            possibleBypassFlag: row.deal.possibleBypassFlag,
            commissionSource: row.deal.commissionSource,
          }
        : null,
      enforcement: {
        activeRestriction: row.activeRestriction ?? null,
      },
      recentEvidenceTrail: row.recentLogs.map((log) => ({
        id: log.id,
        actionAt: log.actionAt,
        eventType: log.eventType,
        actionType: log.actionType,
        reasonCode: log.reasonCode,
        note: log.note,
        adminNote: log.adminNote,
        hub: log.hub,
      })),
    };
  };

  const copyEvidence = async (row: Row) => {
    await navigator.clipboard.writeText(buildEvidenceText(row));
    setCopiedLeadId(row.id);
    window.setTimeout(() => setCopiedLeadId((current) => (current === row.id ? null : current)), 1800);
  };

  const exportEvidence = (row: Row) => {
    const blob = new Blob([buildEvidenceText(row)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `immo-contact-${row.id.slice(0, 12)}-evidence.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportLegalPacket = (row: Row) => {
    const blob = new Blob([JSON.stringify(buildLegalPacket(row), null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `immo-contact-${row.id.slice(0, 12)}-legal-packet.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const saveLogNote = async (logId: string) => {
    const adminNote = (logNoteDraft[logId] ?? "").trim();
    if (!adminNote) {
      alert("Enter an admin note before saving.");
      return;
    }

    setSavingLogId(logId);
    try {
      const r = await fetch(`/api/admin/immo-contact-logs/${encodeURIComponent(logId)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(typeof j.error === "string" ? j.error : "Failed to save admin note.");
        return;
      }
      await load();
    } finally {
      setSavingLogId(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.toLowerCase().includes(q) ||
      (row.listingCode ?? "").toLowerCase().includes(q) ||
      (row.introducedByBroker?.name ?? "").toLowerCase().includes(q) ||
      (row.introducedByBroker?.email ?? "").toLowerCase().includes(q);
    const matchesRestriction =
      restrictionFilter === "all" ||
      (restrictionFilter === "restricted" && Boolean(row.activeRestriction)) ||
      (restrictionFilter === "open" && !row.activeRestriction);
    const matchesDeal =
      dealFilter === "all" ||
      (dealFilter === "bypass" && Boolean(row.deal?.possibleBypassFlag)) ||
      (dealFilter === "linked" && Boolean(row.deal)) ||
      (dealFilter === "unlinked" && !row.deal);

    return matchesSearch && matchesRestriction && matchesDeal;
  });

  const restrictedCount = filteredRows.filter((row) => Boolean(row.activeRestriction)).length;
  const bypassCount = filteredRows.filter((row) => Boolean(row.deal?.possibleBypassFlag)).length;
  const linkedCount = filteredRows.filter((row) => Boolean(row.deal)).length;
  const filteredCsvRows = [
    [
      "Lead ID",
      "Name",
      "Email",
      "Phone",
      "Listing Code",
      "Broker",
      "First Platform Contact",
      "Active Restriction",
      "Deal ID",
      "Deal Status",
      "Possible Bypass",
      "Commission Eligible",
      "Commission Source",
      "Conversation ID",
    ],
    ...filteredRows.map((row) => [
      row.id,
      row.name,
      row.email,
      row.phone,
      row.listingCode ?? row.listingId ?? "",
      row.introducedByBroker?.name ?? row.introducedByBroker?.email ?? "",
      new Date(row.firstPlatformContactAt ?? row.createdAt).toISOString(),
      row.activeRestriction ?? "",
      row.deal?.id ?? "",
      row.deal?.status ?? "",
      row.deal?.possibleBypassFlag ? "yes" : "no",
      row.commissionEligible ? "yes" : "no",
      row.commissionSource ?? "",
      row.platformConversationId ?? "",
    ]),
  ];
  const filteredCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    filteredCsvRows
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")
  )}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">ImmoContact leads</h1>
        <p className="mt-2 text-sm text-slate-400">
          Platform-originated contacts — traceability, commission source, and deal linkage. Use the tool below to attach
          or clear a deal link when resolving disputes.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-premium-gold">Manual deal ↔ lead link</h2>
        <p className="mt-1 text-xs text-slate-500">Paste deal UUID and lead UUID (empty lead = unlink).</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            placeholder="Deal ID"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            value={leadIdInput}
            onChange={(e) => setLeadIdInput(e.target.value)}
            placeholder="Lead ID (optional)"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void linkDeal()}
            className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-[#0B0B0B] disabled:opacity-50"
          >
            {busy !== null ? "…" : "Apply"}
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Visible leads" value={String(filteredRows.length)} sublabel="Current ImmoContact queue" tone="slate" />
        <SummaryCard label="Restricted" value={String(restrictedCount)} sublabel="Active enforcement in effect" tone="red" />
        <SummaryCard label="Possible bypass" value={String(bypassCount)} sublabel="Deals flagged for commission risk" tone="amber" />
        <SummaryCard label="Linked deals" value={String(linkedCount)} sublabel="Leads already tied to a deal" tone="green" />
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contact, broker, phone, or listing code"
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <select
            value={restrictionFilter}
            onChange={(e) => setRestrictionFilter(e.target.value as typeof restrictionFilter)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="all">All restriction states</option>
            <option value="restricted">Restricted only</option>
            <option value="open">Open only</option>
          </select>
          <select
            value={dealFilter}
            onChange={(e) => setDealFilter(e.target.value as typeof dealFilter)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="all">All deal states</option>
            <option value="bypass">Possible bypass</option>
            <option value="linked">Linked to deal</option>
            <option value="unlinked">No linked deal</option>
          </select>
          <a
            href={filteredCsvHref}
            download="immo-contact-filtered-queue.csv"
            className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
          >
            Export filtered CSV
          </a>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">ImmoContact</th>
              <th className="px-3 py-2">First contact</th>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Broker</th>
              <th className="px-3 py-2">Deal</th>
              <th className="px-3 py-2">Legal control</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No ImmoContact leads yet.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/80">
                  <td className="px-3 py-2">
                    <span className="rounded bg-premium-gold/20 px-2 py-0.5 font-semibold text-premium-gold">ImmoContact</span>
                    <div className="mt-1 font-mono text-[10px] text-slate-500">{r.id.slice(0, 12)}…</div>
                    <div className="text-slate-400">{r.name}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                    {(r.firstPlatformContactAt ?? r.createdAt)
                      ? new Date(r.firstPlatformContactAt ?? r.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.listingCode ? (
                      <span className="font-mono text-premium-gold">{r.listingCode}</span>
                    ) : (
                      <span className="font-mono text-slate-500">{r.listingId?.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {r.introducedByBroker?.name ?? r.introducedByBroker?.email ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.deal ? (
                      <div>
                        <Link href={`/dashboard/deals/${r.deal.id}`} className="text-premium-gold hover:underline">
                          {r.deal.id.slice(0, 8)}…
                        </Link>
                        <div className="text-slate-500">{r.deal.status}</div>
                        {r.deal.possibleBypassFlag ? (
                          <span className="text-amber-400">Possible bypass</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 min-w-[280px]">
                    {r.activeRestriction ? (
                      <div className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200">
                        Active: {r.activeRestriction}
                      </div>
                    ) : (
                      <div className="mb-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                        No active restriction
                      </div>
                    )}
                    <select
                      value={actionDraft[r.id] ?? ""}
                      onChange={(e) => setActionDraft((m) => ({ ...m, [r.id]: e.target.value }))}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white"
                    >
                      <option value="">Select action</option>
                      {ACTIONS.map((action) => (
                        <option key={action.id} value={action.id}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={reasonDraft[r.id] ?? ""}
                      onChange={(e) => setReasonDraft((m) => ({ ...m, [r.id]: e.target.value }))}
                      placeholder="Reason code"
                      className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white"
                    />
                    <textarea
                      value={noteDraft[r.id] ?? ""}
                      onChange={(e) => setNoteDraft((m) => ({ ...m, [r.id]: e.target.value }))}
                      placeholder="Immutable admin action note"
                      rows={3}
                      className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white"
                    />
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void applyAction(r.id)}
                      className="mt-2 rounded bg-rose-500 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      {busy === r.id ? "Applying..." : "Apply control"}
                    </button>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <LegalPacketLink href={`/admin/immocontacts/${r.id}`} />
                      <button
                        type="button"
                        onClick={() => void copyEvidence(r)}
                        className="rounded border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-premium-gold/40"
                      >
                        {copiedLeadId === r.id ? "Copied" : "Copy evidence"}
                      </button>
                      <button
                        type="button"
                        onClick={() => exportEvidence(r)}
                        className="rounded border border-emerald-500/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
                      >
                        Export evidence
                      </button>
                      <button
                        type="button"
                        onClick={() => exportLegalPacket(r)}
                        className="rounded border border-premium-gold/30 px-3 py-1.5 text-[11px] font-semibold text-premium-gold transition hover:bg-premium-gold/10"
                      >
                        Export legal packet
                      </button>
                    </div>
                    <details className="mt-3 rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                      <summary className="cursor-pointer text-[11px] font-semibold text-slate-300">
                        Recent evidence trail
                      </summary>
                      <div className="mt-2 space-y-2">
                        {r.recentLogs.length === 0 ? (
                          <p className="text-[11px] text-slate-500">No related audit events yet.</p>
                        ) : (
                          r.recentLogs.map((log) => (
                            <div key={log.id} className="rounded border border-slate-800 bg-slate-900/80 p-2 text-[11px]">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                                  {log.eventType}
                                </span>
                                {log.actionType ? (
                                  <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-200">
                                    {log.actionType}
                                  </span>
                                ) : null}
                                <span className="text-slate-500">{new Date(log.actionAt).toLocaleString()}</span>
                              </div>
                              <div className="mt-1 text-slate-300">
                                {log.note ?? "No event note"}{log.reasonCode ? ` · reason ${log.reasonCode}` : ""}
                              </div>
                              {log.adminNote ? <div className="mt-1 text-amber-200">Admin note: {log.adminNote}</div> : null}
                              <div className="mt-1 text-slate-500">Hub: {log.hub ?? "unknown"}</div>
                              <textarea
                                value={logNoteDraft[log.id] ?? log.adminNote ?? ""}
                                onChange={(e) => setLogNoteDraft((m) => ({ ...m, [log.id]: e.target.value }))}
                                placeholder="Add immutable admin note to this event"
                                rows={2}
                                className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white"
                              />
                              <button
                                type="button"
                                disabled={savingLogId === log.id}
                                onClick={() => void saveLogNote(log.id)}
                                className="mt-2 rounded border border-amber-500/30 px-3 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/10 disabled:opacity-50"
                              >
                                {savingLogId === log.id ? "Saving note..." : "Save event note"}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string;
  value: string;
  sublabel: string;
  tone: "slate" | "red" | "amber" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "border-rose-500/20 bg-rose-500/5 text-rose-200"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/5 text-amber-200"
        : tone === "green"
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
          : "border-slate-700 bg-slate-900/50 text-slate-300";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}
