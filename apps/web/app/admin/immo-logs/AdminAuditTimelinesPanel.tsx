"use client";

import { useCallback, useMemo, useState } from "react";
import { EventTimeline } from "@/components/timeline/EventTimeline";
import type { TimelineItemProps } from "@/components/timeline/TimelineItem";
import { badgeForAdminTimelineSource } from "@/lib/timeline/admin-source-badges";

type Tab = "fsbo" | "booking" | "contract" | "deal" | "dispute" | "user";

type Entry = {
  sortAt: string;
  source: string;
  label: string;
  detail: Record<string, unknown>;
};

function mapEntries(entries: Entry[], auditMode: boolean): TimelineItemProps[] {
  return entries.map((e) => ({
    title: e.label,
    at: e.sortAt,
    auditMode,
    badge: badgeForAdminTimelineSource(e.source),
    badgeLabel: e.source.replace(/_/g, " "),
    meta: <span className="font-mono text-[10px] text-slate-600">{e.source}</span>,
    detail: (
      <pre className="max-h-40 overflow-auto rounded bg-slate-950/60 p-2 text-[10px] text-slate-400">
        {JSON.stringify(e.detail, null, 2)}
      </pre>
    ),
    showRelative: !auditMode,
  }));
}

export function AdminAuditTimelinesPanel() {
  const [tab, setTab] = useState<Tab>("fsbo");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [auditMode, setAuditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [headline, setHeadline] = useState<string | null>(null);

  const [fsboId, setFsboId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [contractId, setContractId] = useState("");
  const [dealId, setDealId] = useState("");
  const [disputeId, setDisputeId] = useState("");
  const [timelineUserId, setTimelineUserId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let url = "";
      if (tab === "fsbo") {
        const id = fsboId.trim();
        if (!id) {
          setError("Enter FSBO listing id");
          return;
        }
        url = `/api/admin/timeline/fsbo-listing?${new URLSearchParams({ listingId: id, order })}`;
      } else if (tab === "booking") {
        const id = bookingId.trim();
        if (!id) {
          setError("Enter booking id");
          return;
        }
        url = `/api/admin/timeline/booking?${new URLSearchParams({ bookingId: id, order })}`;
      } else if (tab === "contract") {
        const id = contractId.trim();
        if (!id) {
          setError("Enter contract id");
          return;
        }
        url = `/api/admin/timeline/contract?${new URLSearchParams({ contractId: id, order })}`;
      } else if (tab === "deal") {
        const id = dealId.trim();
        if (!id) {
          setError("Enter deal id");
          return;
        }
        url = `/api/admin/timeline/deal?${new URLSearchParams({ dealId: id, order })}`;
      } else if (tab === "dispute") {
        const id = disputeId.trim();
        if (!id) {
          setError("Enter dispute id");
          return;
        }
        url = `/api/admin/timeline/dispute?${new URLSearchParams({ disputeId: id, order })}`;
      } else {
        const id = timelineUserId.trim();
        if (!id) {
          setError("Enter user id");
          return;
        }
        url = `/api/admin/timeline/user?${new URLSearchParams({ userId: id, order })}`;
      }

      const r = await fetch(url, { credentials: "same-origin" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(typeof j.error === "string" ? j.error : "Failed to load");
        setEntries([]);
        setHeadline(null);
        return;
      }
      setEntries(Array.isArray(j.timeline) ? j.timeline : []);
      if (tab === "fsbo" && j.listing?.title) setHeadline(String(j.listing.title));
      else if (tab === "booking" && j.booking?.confirmationCode)
        setHeadline(`Booking ${j.booking.confirmationCode ?? j.booking.id}`);
      else if (tab === "contract") setHeadline(`Contract ${j.contract?.id ?? ""}`);
      else if (tab === "deal")
        setHeadline(
          j.deal?.listingCode
            ? `Deal ${j.deal.id} · ${j.deal.listingCode}`
            : `Deal ${j.deal?.id ?? ""}`
        );
      else if (tab === "dispute") setHeadline(`Dispute ${j.dispute?.id ?? ""}`);
      else if (tab === "user" && j.user?.email) setHeadline(`${j.user.email} (${j.user.id?.slice(0, 8)}…)`);
      else setHeadline(null);
    } finally {
      setLoading(false);
    }
  }, [tab, order, fsboId, bookingId, contractId, dealId, disputeId, timelineUserId]);

  const items = useMemo(() => mapEntries(entries, auditMode), [entries, auditMode]);

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
      <h2 className="text-sm font-semibold text-[#C9A646]">Admin audit timelines</h2>
      <p className="mt-1 text-xs text-slate-500">
        UTC in database; browser-local display. Toggle “Raw UTC” for ISO-style audit lines. Default sort: newest first.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {(
          [
            ["fsbo", "FSBO listing"],
            ["booking", "Booking"],
            ["contract", "Contract"],
            ["deal", "Deal"],
            ["dispute", "Dispute"],
            ["user", "User"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === k ? "bg-[#C9A646] text-black" : "bg-slate-800 text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {tab === "fsbo" ? (
          <input
            value={fsboId}
            onChange={(e) => setFsboId(e.target.value)}
            placeholder="FSBO listing id"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-sm text-slate-200"
          />
        ) : null}
        {tab === "booking" ? (
          <input
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Booking UUID"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-sm text-slate-200"
          />
        ) : null}
        {tab === "contract" ? (
          <input
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            placeholder="Contract UUID"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-sm text-slate-200"
          />
        ) : null}
        {tab === "deal" ? (
          <input
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            placeholder="Deal UUID"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-sm text-slate-200"
          />
        ) : null}
        {tab === "dispute" ? (
          <input
            value={disputeId}
            onChange={(e) => setDisputeId(e.target.value)}
            placeholder="Dispute UUID"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-sm text-slate-200"
          />
        ) : null}
        {tab === "user" ? (
          <input
            value={timelineUserId}
            onChange={(e) => setTimelineUserId(e.target.value)}
            placeholder="User id (UUID)"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-sm text-slate-200"
          />
        ) : null}

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value === "asc" ? "asc" : "desc")}
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={auditMode} onChange={(e) => setAuditMode(e.target.checked)} />
          Raw UTC line
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="rounded-xl bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      {headline ? <p className="mt-2 text-sm text-slate-300">{headline}</p> : null}

      <div className="mt-4 border-t border-slate-800 pt-4">
        <EventTimeline items={items} emptyLabel="Load a timeline to see ordered events." />
      </div>
    </section>
  );
}
