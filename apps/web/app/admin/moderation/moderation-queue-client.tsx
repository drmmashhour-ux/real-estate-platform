"use client";

import { useState } from "react";
import Link from "next/link";
import { LegalPacketLink } from "@/components/admin/LegalPacketLink";
import {
  allModerationRequirementsComplete,
  type ModerationRequirement,
} from "@/lib/bnhub/moderation-requirements";

type Listing = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  address: string;
  country: string;
  listingAuthorityType: string | null;
  submittedForVerificationAt: string | null;
  rejectionReason: string | null;
  nightPriceCents: number;
  verificationDocUrl: string | null;
  owner: { id: string; name: string | null; email: string };
  _count: { reviews: number; bookings: number };
  requirements: ModerationRequirement[];
  recentVerificationLogs: Array<{
    id: string;
    step: string;
    status: string;
    notes: string | null;
    createdBy: string | null;
    createdAt: string;
  }>;
};

export function ModerationQueueClient({
  initialListings,
}: {
  initialListings: Listing[];
}) {
  const [listings, setListings] = useState(initialListings);
  const [search, setSearch] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<"all" | "ready" | "blocked">("all");
  const [authorityFilter, setAuthorityFilter] = useState<"all" | "broker" | "owner">("all");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [savingNoteFor, setSavingNoteFor] = useState<string | null>(null);
  const [notifySent, setNotifySent] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  function clearError(id: string) {
    setActionError((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleNotifyHost(id: string) {
    setNotifying(id);
    clearError(id);
    setNotifySent((prev) => ({ ...prev, [id]: false }));
    try {
      const res = await fetch(`/api/bnhub/moderation/${id}/notify-host`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifySent((prev) => ({ ...prev, [id]: true }));
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      const msg =
        data?.code === "DEMO_MODE"
          ? "Demo mode blocks this action."
          : data?.error ?? `Request failed (${res.status})`;
      setActionError((prev) => ({ ...prev, [id]: msg }));
    } finally {
      setNotifying(null);
    }
  }

  async function handleApprove(id: string) {
    const listing = listings.find((l) => l.id === id);
    if (listing && !allModerationRequirementsComplete(listing.requirements)) {
      setActionError((prev) => ({
        ...prev,
        [id]: "Approve is only available when every checklist row is complete (green ✓), including at least 10 photos and Stripe Connect.",
      }));
      return;
    }

    setApproving(id);
    clearError(id);
    try {
      const res = await fetch(`/api/bnhub/moderation/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      const msg =
        data?.code === "DEMO_MODE"
          ? "Demo mode blocks this action."
          : data?.error ?? `Request failed (${res.status})`;
      setActionError((prev) => ({ ...prev, [id]: msg }));
    } finally {
      setApproving(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    setRejecting(id);
    clearError(id);
    try {
      const res = await fetch(`/api/bnhub/moderation/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      const msg =
        data?.code === "DEMO_MODE"
          ? "Demo mode blocks this action."
          : data?.error ?? `Request failed (${res.status})`;
      setActionError((prev) => ({ ...prev, [id]: msg }));
    } finally {
      setRejecting(null);
    }
  }

  async function handleSaveAdminNote(id: string) {
    const note = (noteDrafts[id] ?? "").trim();
    if (!note) {
      setActionError((prev) => ({ ...prev, [id]: "Enter an admin note before saving." }));
      return;
    }

    setSavingNoteFor(id);
    clearError(id);
    try {
      const res = await fetch(`/api/bnhub/moderation/${id}/admin-note`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; id?: string; step?: string; status?: string; notes?: string | null; createdBy?: string | null; createdAt?: string }
        | null;
      if (!res.ok) {
        setActionError((prev) => ({ ...prev, [id]: data?.error ?? `Request failed (${res.status})` }));
        return;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id !== id
            ? listing
            : {
                ...listing,
                recentVerificationLogs: data?.id
                  ? [
                      {
                        id: data.id,
                        step: data.step ?? "ADMIN_NOTE",
                        status: data.status ?? "PENDING",
                        notes: data.notes ?? note,
                        createdBy: data.createdBy ?? null,
                        createdAt: data.createdAt ?? new Date().toISOString(),
                      },
                      ...listing.recentVerificationLogs,
                    ].slice(0, 12)
                  : listing.recentVerificationLogs,
              }
        )
      );
      setNoteDrafts((prev) => ({ ...prev, [id]: "" }));
    } finally {
      setSavingNoteFor(null);
    }
  }

  const filteredListings = listings.filter((listing) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      listing.title.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query) ||
      listing.address.toLowerCase().includes(query) ||
      listing.listingCode.toLowerCase().includes(query) ||
      (listing.owner.name ?? "").toLowerCase().includes(query) ||
      listing.owner.email.toLowerCase().includes(query);
    const isReady = allModerationRequirementsComplete(listing.requirements);
    const matchesReadiness =
      readinessFilter === "all" ||
      (readinessFilter === "ready" && isReady) ||
      (readinessFilter === "blocked" && !isReady);
    const authority = listing.listingAuthorityType === "BROKER" ? "broker" : "owner";
    const matchesAuthority = authorityFilter === "all" || authority === authorityFilter;
    return matchesSearch && matchesReadiness && matchesAuthority;
  });
  const readyCount = filteredListings.filter((listing) => allModerationRequirementsComplete(listing.requirements)).length;
  const blockedCount = filteredListings.length - readyCount;
  const brokerAuthorityCount = filteredListings.filter((listing) => listing.listingAuthorityType === "BROKER").length;
  const csvRows = [
    [
      "Listing ID",
      "Listing Code",
      "Title",
      "City",
      "Address",
      "Country",
      "Authority Type",
      "Submitted At",
      "Host",
      "Host Email",
      "Night Price",
      "Reviews",
      "Bookings",
      "Requirements Complete",
      "Latest Log At",
      "Latest Log Step",
      "Latest Log Status",
      "Latest Log Notes",
    ],
    ...filteredListings.map((listing) => {
      const latestLog = listing.recentVerificationLogs[0];
      const complete = listing.requirements.filter((r) => r.status === "complete").length;
      return [
        listing.id,
        listing.listingCode,
        listing.title,
        listing.city,
        listing.address,
        listing.country,
        listing.listingAuthorityType ?? "OWNER",
        listing.submittedForVerificationAt ?? "",
        listing.owner.name ?? "",
        listing.owner.email,
        (listing.nightPriceCents / 100).toFixed(2),
        String(listing._count.reviews),
        String(listing._count.bookings),
        `${complete}/${listing.requirements.length}`,
        latestLog?.createdAt ?? "",
        latestLog?.step ?? "",
        latestLog?.status ?? "",
        latestLog?.notes ?? "",
      ];
    }),
  ];
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    csvRows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
  )}`;
  const legalPacket = {
    exportedAt: new Date().toISOString(),
    filters: {
      search: search.trim() || null,
      readiness: readinessFilter,
      authority: authorityFilter,
    },
    totals: {
      visibleListings: filteredListings.length,
      readyForApproval: readyCount,
      blocked: blockedCount,
      brokerAuthority: brokerAuthorityCount,
    },
    listings: filteredListings.map((listing) => ({
      id: listing.id,
      listingCode: listing.listingCode,
      title: listing.title,
      address: {
        city: listing.city,
        address: listing.address,
        country: listing.country,
      },
      owner: listing.owner,
      pricing: {
        nightPriceCents: listing.nightPriceCents,
      },
      workflow: {
        listingAuthorityType: listing.listingAuthorityType,
        submittedForVerificationAt: listing.submittedForVerificationAt,
        rejectionReason: listing.rejectionReason,
      },
      demandSignals: listing._count,
      requirements: listing.requirements,
      recentVerificationLogs: listing.recentVerificationLogs,
    })),
  };
  const jsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(legalPacket, null, 2))}`;
  const evidenceText = [
    "BNHUB MODERATION LEGAL EVIDENCE",
    `Exported At: ${legalPacket.exportedAt}`,
    `Visible Listings: ${filteredListings.length}`,
    `Filters: search=${search.trim() || "all"} | readiness=${readinessFilter} | authority=${authorityFilter}`,
    "",
    ...filteredListings.flatMap((listing, index) => {
      const complete = listing.requirements.filter((r) => r.status === "complete").length;
      return [
        `#${index + 1} ${listing.title}`,
        `Listing ID: ${listing.id}`,
        `Listing Code: ${listing.listingCode}`,
        `Location: ${listing.city}, ${listing.address}, ${listing.country}`,
        `Authority Type: ${listing.listingAuthorityType ?? "OWNER"}`,
        `Host: ${listing.owner.name ?? "Unknown"} <${listing.owner.email}>`,
        `Submitted For Verification: ${listing.submittedForVerificationAt ?? "n/a"}`,
        `Checklist Completion: ${complete}/${listing.requirements.length}`,
        "Requirements:",
        ...listing.requirements.map((requirement) => `- ${requirement.label} | ${requirement.status} | ${requirement.hint ?? "n/a"}`),
        "Recent Verification Logs:",
        ...(listing.recentVerificationLogs.length
          ? listing.recentVerificationLogs.map(
              (log) =>
                `- ${log.createdAt} | ${log.step} | ${log.status} | by=${log.createdBy ?? "system"} | ${log.notes ?? "n/a"}`
            )
          : ["- none"]),
        "",
      ];
    }),
  ].join("\n");
  const evidenceHref = `data:text/plain;charset=utf-8,${encodeURIComponent(evidenceText)}`;

  if (listings.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
        No listings pending verification.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Visible listings" value={String(filteredListings.length)} sublabel="Current moderation queue" tone="slate" />
        <SummaryCard label="Ready to approve" value={String(readyCount)} sublabel="All checklist rows complete" tone="green" />
        <SummaryCard label="Blocked" value={String(blockedCount)} sublabel="Still missing one or more requirements" tone="amber" />
        <SummaryCard label="Broker authority" value={String(brokerAuthorityCount)} sublabel="Listings submitted under broker authority" tone="gold" />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search listing, code, host, or city"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={readinessFilter}
            onChange={(event) => setReadinessFilter(event.target.value as typeof readinessFilter)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="all">All readiness states</option>
            <option value="ready">Ready to approve</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={authorityFilter}
            onChange={(event) => setAuthorityFilter(event.target.value as typeof authorityFilter)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="all">All authority types</option>
            <option value="broker">Broker authority</option>
            <option value="owner">Owner authority</option>
          </select>
          <a
            href={csvHref}
            download="bnhub-moderation-queue.csv"
            className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10"
          >
            Export CSV
          </a>
          <a
            href={jsonHref}
            download="bnhub-moderation-legal-packet.json"
            className="rounded-lg border border-sky-500/30 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/10"
          >
            Export legal packet
          </a>
          <a
            href={evidenceHref}
            download="bnhub-moderation-evidence.txt"
            className="rounded-lg border border-fuchsia-500/30 px-4 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/10"
          >
            Export evidence
          </a>
        </div>
      </section>

      {filteredListings.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
          No listings match the current moderation filters.
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredListings.map((l) => (
        <li key={l.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link href={`/bnhub/${l.id}`} className="font-semibold text-slate-100 hover:text-emerald-300">
                {l.title}
              </Link>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                {l.listingCode} · {l.listingAuthorityType === "BROKER" ? "Broker authority" : "Owner authority"}
              </p>
              <p className="mt-1 text-sm text-slate-400">{l.city} · {l.address}</p>
              <p className="text-sm text-slate-500">
                Host: {l.owner.name ?? l.owner.email} · ${(l.nightPriceCents / 100).toFixed(0)}/night · {l._count.reviews} reviews
              </p>
              <p className="text-xs text-slate-500">
                Submitted: {l.submittedForVerificationAt ? new Date(l.submittedForVerificationAt).toLocaleString() : "Unknown"}
              </p>
              {l.verificationDocUrl && (
                <a href={l.verificationDocUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-emerald-400 hover:underline">
                  View verification doc
                </a>
              )}
              {actionError[l.id] && (
                <p className="mt-2 text-sm text-red-400" role="alert">
                  {actionError[l.id]}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <LegalPacketLink
                href={`/admin/moderation/${encodeURIComponent(l.id)}`}
                className="rounded-lg border border-sky-500/30 px-3 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/10"
              />
              <button
                type="button"
                onClick={() => void handleNotifyHost(l.id)}
                disabled={notifying === l.id}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {notifying === l.id ? "Sending…" : "Notify host (AI checklist)"}
              </button>
              <button
                type="button"
                onClick={() => void handleApprove(l.id)}
                disabled={approving === l.id || !allModerationRequirementsComplete(l.requirements)}
                title={
                  allModerationRequirementsComplete(l.requirements)
                    ? undefined
                    : "All checklist items must be complete before approval."
                }
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {approving === l.id ? "Approving…" : "Approve"}
              </button>
              <RejectButton
                listingId={l.id}
                onReject={handleReject}
                disabled={rejecting === l.id}
              />
            </div>
          </div>
          <ModerationRequirementsChecklist requirements={l.requirements} />
          <details className="mt-4 rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent verification evidence
            </summary>
            <div className="mt-3 space-y-2">
              {l.recentVerificationLogs.length ? (
                l.recentVerificationLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                    <p className="font-medium text-slate-100">
                      {log.step} · {log.status}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()} · actor {log.createdBy ?? "system"}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-slate-400">{log.notes ?? "No note."}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No verification logs recorded yet.</p>
              )}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add admin legal note</p>
                <textarea
                  value={noteDrafts[l.id] ?? ""}
                  onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [l.id]: event.target.value }))}
                  placeholder="Record a legal annotation, escalation note, or review instruction."
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleSaveAdminNote(l.id)}
                    disabled={savingNoteFor === l.id}
                    className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/20 disabled:opacity-50"
                  >
                    {savingNoteFor === l.id ? "Saving…" : "Save admin note"}
                  </button>
                </div>
              </div>
            </div>
          </details>
          {notifySent[l.id] ? (
            <p className="mt-2 text-xs text-emerald-400">Reminder sent to host (in-app + email if configured).</p>
          ) : null}
        </li>
          ))}
        </ul>
      )}
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
  tone: "slate" | "green" | "amber" | "gold";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/5"
        : tone === "gold"
          ? "border-amber-400/20 bg-amber-400/5"
          : "border-slate-800 bg-slate-900/60";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}

function ModerationRequirementsChecklist({
  requirements,
}: {
  requirements: ModerationRequirement[];
}) {
  const complete = requirements.filter((r) => r.status === "complete").length;
  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Hosting requirements
        </p>
        <p className="text-xs text-slate-500">
          {complete}/{requirements.length} complete
        </p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Verification checklist">
        {requirements.map((r) => (
          <li
            key={r.key}
            className="flex gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-sm"
          >
            <span
              className="mt-0.5 shrink-0 font-mono text-xs"
              aria-hidden
              title={r.status}
            >
              {r.status === "complete" ? (
                <span className="text-emerald-400">✓</span>
              ) : r.status === "partial" ? (
                <span className="text-amber-400">!</span>
              ) : (
                <span className="text-red-400">✕</span>
              )}
            </span>
            <div className="min-w-0">
              <span
                className={
                  r.status === "complete"
                    ? "text-slate-200"
                    : r.status === "partial"
                      ? "text-amber-200/90"
                      : "text-red-200/90"
                }
              >
                {r.label}
              </span>
              {r.hint ? (
                <p className="mt-0.5 whitespace-pre-line text-xs text-slate-500">{r.hint}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RejectButton({
  listingId,
  onReject,
  disabled,
}: {
  listingId: string;
  onReject: (id: string, reason: string) => void;
  disabled: boolean;
}) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        disabled={disabled}
        className="rounded-lg border border-red-500/50 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        Reject
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Rejection reason (shown to host)"
        className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onReject(listingId, reason || "Does not meet verification criteria.")}
          disabled={disabled}
          className="rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-300 hover:bg-red-500/30"
        >
          Confirm reject
        </button>
        <button
          type="button"
          onClick={() => { setShow(false); setReason(""); }}
          className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
