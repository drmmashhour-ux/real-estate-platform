"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type DesignPayload = {
  listingId: string;
  title: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  marketingHeadline: string;
  marketingBody: string;
};

type DesignAccessState = {
  status: "no-trial" | "active" | "expired" | "paid";
  daysRemaining: number | null;
};

export default function DesignStudioPage() {
  const [listingId, setListingId] = useState<string | null>(null);

  const [payload, setPayload] = useState<DesignPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveUrl, setSaveUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastChargeCents, setLastChargeCents] = useState<number | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [access, setAccess] = useState<DesignAccessState | null>(null);
  const [designAccessLoading, setDesignAccessLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Apply URL param on mount (avoids `useSearchParams()` Suspense requirement during build).
  useEffect(() => {
    const id =
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("listingId");
    setListingId(id);
  }, []);

  useEffect(() => {
    setDesignAccessLoading(true);
    fetch("/api/design/access", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status != null) {
          setAccess({
            status: data.status,
            daysRemaining: data.daysRemaining ?? null,
          });
        }
      })
      .catch(() => setAccess(null))
      .finally(() => setDesignAccessLoading(false));
  }, []);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    setPayload(null);
    fetch(`/api/design-studio/payload?listingId=${encodeURIComponent(listingId)}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Failed to load listing");
          return;
        }
        setPayload(data.payload ?? null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load listing");
      })
      .finally(() => setLoading(false));
  }, [listingId]);

  async function copyContent() {
    if (!payload) return;
    const text = [payload.marketingHeadline, "", payload.marketingBody].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function attachToListing() {
    if (!payload?.listingId || !saveUrl.trim()) return;
    setSaving(true);
    setSaved(false);
    setLastChargeCents(null);
    setTrialEndsAt(null);
    try {
      const res = await fetch("/api/design-studio/save-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: payload.listingId,
          designUrl: saveUrl.trim(),
          title: payload.marketingHeadline || payload.title,
        }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(true);
        if (typeof data.chargeCents === "number" && data.chargeCents > 0) {
          setLastChargeCents(data.chargeCents);
        }
        if (typeof data.trialEndsAt === "string") {
          setTrialEndsAt(data.trialEndsAt);
        }
      } else {
        setError(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              ← Home
            </Link>
            <span className="text-slate-400">·</span>
            <Link href="/tools/dictation-correction" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              Dictation correction
            </Link>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Design Studio</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Save your Canva design link to this listing. Use the template picker to open Canva in your own account, then paste the design URL here.
          </p>
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            You will edit this design in your own Canva account. Your designs stay private.
          </p>
          {!designAccessLoading && access?.status === "active" && access.daysRemaining != null && (
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Trial ends in {access.daysRemaining} day{access.daysRemaining !== 1 ? "s" : ""}.
            </p>
          )}
          {!designAccessLoading && access?.status === "expired" && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
              <p className="font-medium text-amber-800 dark:text-amber-200">Trial expired — upgrade to continue.</p>
              <button
                type="button"
                onClick={async () => {
                  setCheckoutLoading(true);
                  try {
                    const res = await fetch("/api/design-access/checkout", { method: "POST", credentials: "same-origin" });
                    const data = await res.json().catch(() => ({}));
                    if (data?.url) window.location.href = data.url;
                  } finally {
                    setCheckoutLoading(false);
                  }
                }}
                disabled={checkoutLoading}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {checkoutLoading ? "Loading…" : "Upgrade — $5"}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {designAccessLoading && (
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        )}

        {!designAccessLoading && access?.status === "expired" && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-slate-600 dark:text-slate-400">Design Studio is available after you upgrade.</p>
            <button
              type="button"
              onClick={async () => {
                setCheckoutLoading(true);
                try {
                  const res = await fetch("/api/design-access/checkout", { method: "POST", credentials: "same-origin" });
                  const data = await res.json().catch(() => ({}));
                  if (data?.url) window.location.href = data.url;
                } finally {
                  setCheckoutLoading(false);
                }
              }}
              disabled={checkoutLoading}
              className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {checkoutLoading ? "Loading…" : "Upgrade — $5"}
            </button>
          </div>
        )}

        {!designAccessLoading && access && access.status !== "expired" && !listingId ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-slate-600 dark:text-slate-400">No listing selected.</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
              Open Design Studio from a listing page so the listing loads automatically. Brokers and investors: go to a listing (e.g. from Listings or Properties), then use Design Studio to create and save your design to that listing.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/listings"
                className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                ← Listings
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Properties →
              </Link>
            </div>
          </div>
        ) : !designAccessLoading && access && access.status !== "expired" && listingId && loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-slate-600 dark:text-slate-400">Loading listing…</p>
          </div>
        ) : !designAccessLoading && access && access.status !== "expired" && listingId && error ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-amber-600 dark:text-amber-400">{error}</p>
            <Link
              href="/dashboard/listings"
              className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              ← Go to listings
            </Link>
          </div>
        ) : null}

        {!designAccessLoading && access && access.status !== "expired" && payload && (
          <>
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Choose a template</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Open the template picker to start a design in your own Canva account.
              </p>
              <Link
                href={`/design-templates?listingId=${encodeURIComponent(listingId ?? "")}`}
                className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400"
              >
                Open template picker →
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Prefilled content</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use this in Canva or copy to clipboard.
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Headline</span>
                  <p className="mt-0.5 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {payload.marketingHeadline}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Body copy</span>
                  <p className="mt-0.5 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {payload.marketingBody}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyContent}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {copied ? "Copied!" : "Copy to clipboard"}
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Export options</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Download design</strong> – In Canva, use File → Download and save the file as SVG.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Save to your dashboard</strong> – Paste your Canva design link below and click Save. It will appear under &quot;Your saved design(s)&quot; on your listing page. <strong className="text-emerald-600 dark:text-emerald-400">7-day free trial</strong> for all visitors, brokers, and partners; after that, a per-design fee of <strong className="font-bold text-slate-900 dark:text-slate-100">$5</strong> is added to your bill.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Canva design URL</label>
                  <input
                    type="url"
                    value={saveUrl}
                    onChange={(e) => setSaveUrl(e.target.value)}
                    placeholder="https://www.canva.com/design/..."
                    className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={attachToListing}
                  disabled={saving || !saveUrl.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : saved ? "Saved" : "Save URL to listing"}
                </button>
              </div>
              {saved && (
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                  Reference saved. You can view it from your listing dashboard.
                  {trialEndsAt && (
                    <span className="block mt-1">You&apos;re on a free trial until {new Date(trialEndsAt).toLocaleDateString()}. No charge for this design.</span>
                  )}
                  {lastChargeCents != null && lastChargeCents > 0 && (
                    <span className="block mt-1">${(lastChargeCents / 100).toFixed(2)} has been added to your bill.</span>
                  )}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
