"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { LecipmListingAssetType, LecipmListingCentrisPublicationState } from "@/types/lecipm-listing-enums-client";
import type { CoOwnershipCompliancePayload } from "@/components/compliance/CoOwnershipChecklist";
import { CoOwnershipChecklist } from "@/components/compliance/CoOwnershipChecklist";
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge";
import { CoownershipComplianceAutopilotCard } from "@/components/autopilot/CoownershipComplianceAutopilotCard";

const TYPES: LecipmListingAssetType[] = ["HOUSE", "CONDO", "MULTI_UNIT", "TOWNHOUSE", "LAND", "OTHER"];

type Props = {
  listing: {
    id: string;
    listingCode: string;
    title: string;
    price: number;
    listingType: LecipmListingAssetType;
    isCoOwnership: boolean;
    crmMarketplaceLive: boolean;
    centrisPublicationState: LecipmListingCentrisPublicationState;
  };
  centris: {
    publicationState: LecipmListingCentrisPublicationState;
    enforcementEnabled: boolean;
    eligible: boolean;
    headline: string;
    detail: string;
  };
  listingsIndexHref: string;
  detailHref: string;
  assistantHref: string;
};

const CENTRIS_STATE_LABEL: Record<LecipmListingCentrisPublicationState, string> = {
  DRAFT: "Draft (Centris)",
  READY_FOR_CENTRIS: "Ready for Centris export",
  PUBLISHED_INTERNAL: "Published on LECIPM marketplace",
  PUBLISHED_CENTRIS: "Marked published to Centris (manual)",
};

export function ListingEditClient({ listing, centris, listingsIndexHref, detailHref, assistantHref }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title);
  const [price, setPrice] = useState(String(listing.price));
  const [listingType, setListingType] = useState<LecipmListingAssetType>(listing.listingType);
  const [isCoOwnership, setIsCoOwnership] = useState(listing.isCoOwnership);
  const [marketplaceLive, setMarketplaceLive] = useState(listing.crmMarketplaceLive);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [badgeState, setBadgeState] = useState<{ applies: boolean; complete: boolean } | null>(null);

  const onComplianceLoaded = useCallback((p: CoOwnershipCompliancePayload) => {
    setBadgeState({ applies: p.applies, complete: p.complete });
  }, []);

  async function patchFields() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/broker/listings/${encodeURIComponent(listing.id)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: Number(price),
          listingType,
          isCoOwnership,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(typeof j.error === "string" ? j.error : "Save failed");
        return;
      }
      setFeedback("Saved.");
      router.refresh();
    } catch {
      setFeedback("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function downloadCentrisExport() {
    setExporting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/broker/listings/${encodeURIComponent(listing.id)}/centris-export`, {
        method: "GET",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setFeedback(typeof j.error === "string" ? j.error : "Centris export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lecipm-centris-export-${listing.listingCode}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback("Centris export downloaded — upload manually to your Centris workflow.");
      router.refresh();
    } catch {
      setFeedback("Network error");
    } finally {
      setExporting(false);
    }
  }

  async function publishListing() {
    setPublishing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/broker/listings/${encodeURIComponent(listing.id)}/publish`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(typeof j.error === "string" ? j.error : "Publish failed");
        return;
      }
      setMarketplaceLive(true);
      setFeedback("Listing is live on marketplace.");
      router.refresh();
    } catch {
      setFeedback("Network error");
    } finally {
      setPublishing(false);
    }
  }

  const needsCo = listingType === "CONDO" || isCoOwnership;
  const showsBadge = badgeState ?? { applies: needsCo, complete: false };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <nav className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
        <Link href={listingsIndexHref} className="hover:text-emerald-600 dark:hover:text-emerald-400">
          ← Listings
        </Link>
        <Link href={detailHref} className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Marketing hub
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <p className="font-mono text-xs text-slate-500">{listing.listingCode}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Edit listing</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ComplianceStatusBadge applies={showsBadge.applies} complete={showsBadge.complete} />
            {!marketplaceLive ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Draft · not on marketplace
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
                Live on marketplace
              </span>
            )}
          </div>
        </div>
        <Link
          href={assistantHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 px-4 py-2.5 text-sm font-bold text-black shadow-sm hover:brightness-110"
        >
          ✨ Generate with AI
        </Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Listing details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-700 dark:text-slate-300">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="block text-sm text-slate-700 dark:text-slate-300">
            Price (CAD)
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="block text-sm text-slate-700 dark:text-slate-300">
            Asset type
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value as LecipmListingAssetType)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-8 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={isCoOwnership} onChange={(e) => setIsCoOwnership(e.target.checked)} />
            Divided co-ownership (non-condo)
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void patchFields()}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      <CoOwnershipChecklist listingId={listing.id} refreshRouter onComplianceLoaded={onComplianceLoaded} />

      <CoownershipComplianceAutopilotCard listingId={listing.id} />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Centris (manual export)</h2>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Status: {CENTRIS_STATE_LABEL[centris.publicationState]}
          {centris.enforcementEnabled ? " · eligibility enforcement on" : ""}
        </p>
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            centris.eligible
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          }`}
        >
          <p className="font-semibold">{centris.headline}</p>
          <p className="mt-1 text-xs opacity-90">{centris.detail}</p>
        </div>
        <button
          type="button"
          disabled={exporting || !centris.eligible}
          onClick={() => void downloadCentrisExport()}
          className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {exporting ? "Preparing…" : "Download Centris JSON (manual upload)"}
        </button>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          LECIPM never impersonates Centris. Use your board-authorized Centris portal to complete publication.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Marketplace</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Publishing makes this CRM listing visible on buyer search and public listing routes. Condos require co-ownership
          checklist completion when enforcement is enabled.
        </p>
        {!marketplaceLive ? (
          <button
            type="button"
            disabled={publishing}
            onClick={() => void publishListing()}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish to marketplace"}
          </button>
        ) : (
          <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">Already published.</p>
        )}
      </section>

      {feedback ? <p className="text-sm text-slate-700 dark:text-slate-300">{feedback}</p> : null}
    </div>
  );
}
