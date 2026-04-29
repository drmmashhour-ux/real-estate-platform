"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type {
  ListingAcquisitionIntakeStatus,
  ListingAcquisitionPermissionStatus,
  ListingAcquisitionSourceType,
} from "@/types/listing-acquisition-enums-client";
import { ACQUISITION_COLUMN_LABELS, ACQUISITION_PIPELINE_COLUMNS } from "@/lib/listing-acquisition/constants";

type LeadRow = {
  id: string;
  sourceType: ListingAcquisitionSourceType;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  city: string;
  propertyCategory: string;
  permissionStatus: ListingAcquisitionPermissionStatus;
  intakeStatus: ListingAcquisitionIntakeStatus;
  notes: string | null;
  updatedAt: string;
  linkedFsboListing: { id: string; listingCode: string | null; status: string } | null;
  linkedShortTermListing: { id: string; listingCode: string; listingStatus: string } | null;
};

type Metrics = {
  newToday: number;
  awaitingAssets: number;
  readyForReview: number;
  publishedThisWeek: number;
};

export function AcquisitionBoardClient({
  initialLeads,
  metrics,
}: {
  initialLeads: LeadRow[];
  metrics: Metrics;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [busy, setBusy] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [err, setErr] = useState("");

  const grouped = useMemo(() => {
    const m = new Map<ListingAcquisitionIntakeStatus, LeadRow[]>();
    for (const c of ACQUISITION_PIPELINE_COLUMNS) m.set(c, []);
    for (const l of leads) {
      const arr = m.get(l.intakeStatus) ?? [];
      arr.push(l);
      m.set(l.intakeStatus, arr);
    }
    return m;
  }, [leads]);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    setErr("");
    try {
      const res = await fetch(`/api/admin/listing-acquisition/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      const r2 = await fetch("/api/admin/listing-acquisition");
      const full = await r2.json();
      if (Array.isArray(full.leads)) setLeads(full.leads);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }, []);

  const archive = (id: string) => patch(id, { intakeStatus: "ARCHIVED" });

  const doConvert = async () => {
    if (!convertId || !ownerUserId.trim()) return;
    setBusy(convertId);
    setErr("");
    try {
      const res = await fetch(`/api/admin/listing-acquisition/${encodeURIComponent(convertId)}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerUserId: ownerUserId.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Convert failed");
      const r = await fetch("/api/admin/listing-acquisition");
      const full = await r.json();
      if (full.leads) {
        setLeads(full.leads);
      }
      setConvertId(null);
      setOwnerUserId("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#D4AF37]">Listing acquisition</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/60">
              Permission-based supply pipeline. Do not paste copyrighted text or images from other platforms. Internal rules:{" "}
              <code className="text-white/80">docs/compliance/safe-listing-acquisition.md</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/acquisition/quick-add"
              className="rounded border border-[#D4AF37]/50 px-3 py-1.5 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Quick add (operator)
            </Link>
            <Link
              href="/admin/acquisition/traffic"
              className="rounded border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/10"
            >
              Signup traffic
            </Link>
            <Link
              href="/admin/acquisition/import"
              className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              CSV import
            </Link>
            <Link href="/list-your-property" className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5">
              Public intake (preview)
            </Link>
            <Link href="/admin" className="text-sm text-[#D4AF37] underline-offset-2 hover:underline">
              ← Admin
            </Link>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="New today" value={metrics.newToday} />
          <MetricCard label="Awaiting assets" value={metrics.awaitingAssets} />
          <MetricCard label="Ready for review" value={metrics.readyForReview} />
          <MetricCard label="Published (7d)" value={metrics.publishedThisWeek} />
        </div>

        {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

        <section className="mb-6 rounded border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
          <p className="font-medium text-amber-200">Outreach templates</p>
          <p className="mt-1 text-amber-100/90">
            Copy for owner / broker / host lives in{" "}
            <code className="text-amber-50">docs/growth/listing-acquisition-templates.md</code>.
          </p>
        </section>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {ACQUISITION_PIPELINE_COLUMNS.filter((c) => c !== "ARCHIVED").map((col) => (
            <div key={col} className="w-[300px] shrink-0 rounded-lg border border-white/10 bg-[#0b0b0b]">
              <div className="border-b border-white/10 px-3 py-2 text-sm font-medium text-[#D4AF37]">
                {ACQUISITION_COLUMN_LABELS[col]}{" "}
                <span className="text-white/40">({grouped.get(col)?.length ?? 0})</span>
              </div>
              <ul className="max-h-[70vh] space-y-2 overflow-y-auto p-2">
                {(grouped.get(col) ?? []).map((l) => (
                  <li key={l.id} className="rounded border border-white/10 bg-black/40 p-2 text-xs">
                    <div className="font-medium text-white">{l.contactName}</div>
                    <div className="text-white/50">{l.sourceType.toLowerCase()} · {l.city}</div>
                    <div className="mt-1 text-white/40">perm: {l.permissionStatus.toLowerCase()}</div>
                    <div className="text-white/40">updated {new Date(l.updatedAt).toLocaleString()}</div>
                    {l.notes ? <p className="mt-1 line-clamp-2 text-white/55">{l.notes}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Link href={`/admin/acquisition/${l.id}`} className="text-[#D4AF37] hover:underline">
                        Open
                      </Link>
                      {col === "NEW" ? (
                        <button
                          type="button"
                          disabled={busy === l.id}
                          className="text-white/70 hover:text-white disabled:opacity-40"
                          onClick={() => patch(l.id, { intakeStatus: "CONTACTED" })}
                        >
                          Contacted
                        </button>
                      ) : null}
                      {col === "CONTACTED" ? (
                        <button
                          type="button"
                          disabled={busy === l.id}
                          className="text-white/70 hover:text-white disabled:opacity-40"
                          onClick={() => patch(l.id, { intakeStatus: "INTERESTED" })}
                        >
                          Interested
                        </button>
                      ) : null}
                      {col === "INTERESTED" || col === "CONTACTED" ? (
                        <>
                          <button
                            type="button"
                            disabled={busy === l.id}
                            className="text-white/70 hover:text-white disabled:opacity-40"
                            onClick={() => patch(l.id, { permissionStatus: "GRANTED" })}
                          >
                            Permission OK
                          </button>
                          <button
                            type="button"
                            disabled={busy === l.id}
                            className="text-white/70 hover:text-white disabled:opacity-40"
                            onClick={() => patch(l.id, { intakeStatus: "AWAITING_ASSETS" })}
                          >
                            Awaiting assets
                          </button>
                        </>
                      ) : null}
                      {!l.linkedFsboListing && !l.linkedShortTermListing ? (
                        <button
                          type="button"
                          className="text-emerald-400 hover:text-emerald-300"
                          onClick={() => setConvertId(l.id)}
                        >
                          Convert → draft
                        </button>
                      ) : (
                        <span className="text-white/45">
                          Linked:{" "}
                          {l.linkedFsboListing ? (
                            <Link className="text-[#D4AF37] hover:underline" href={`/admin/fsbo/${l.linkedFsboListing.id}`}>
                              FSBO
                            </Link>
                          ) : null}
                          {l.linkedShortTermListing ? (
                            <Link
                              className="text-[#D4AF37] hover:underline"
                              href={`/bnhub/host/listings/${l.linkedShortTermListing.id}/edit`}
                            >
                              Stay
                            </Link>
                          ) : null}
                        </span>
                      )}
                      <button
                        type="button"
                        className="text-red-400/90 hover:text-red-300"
                        onClick={() => archive(l.id)}
                        disabled={busy === l.id}
                      >
                        Archive
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-2 text-lg font-medium text-white/80">Archived</h2>
          <ul className="space-y-1 text-sm text-white/50">
            {(grouped.get("ARCHIVED") ?? []).map((l) => (
              <li key={l.id}>
                <Link href={`/admin/acquisition/${l.id}`} className="text-[#D4AF37]/80 hover:underline">
                  {l.contactName}
                </Link>{" "}
                — {l.city}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {convertId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/20 bg-[#111] p-4 shadow-xl">
            <h3 className="text-lg font-medium text-white">Convert to draft listing</h3>
            <p className="mt-2 text-sm text-white/60">
              Enter the platform <strong className="text-white">user id</strong> who will own the draft (seller or host).
              Creates FSBO draft (or BNHUB stay for host leads) in <code className="text-white/80">READY_FOR_REVIEW</code> — not
              auto-published.
            </p>
            <input
              className="mt-3 w-full rounded border border-white/20 bg-black px-3 py-2 text-sm text-white"
              placeholder="Owner user UUID"
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="text-white/60 hover:text-white" onClick={() => setConvertId(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!ownerUserId.trim() || busy === convertId}
                className="rounded bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                onClick={() => void doConvert()}
              >
                Create draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-white/10 bg-[#0b0b0b] px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-white/45">{label}</div>
      <div className="text-2xl font-semibold text-[#D4AF37]">{value}</div>
    </div>
  );
}
