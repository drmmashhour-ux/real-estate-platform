"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { StorageAlert } from "../components/storage/StorageAlert";
import { AiInsights } from "../components/storage/AiInsights";

type StatusData = {
  used: string;
  limit: string;
  percent: number;
  status: string;
  usedBytes: number;
  limitBytes: number;
};

type AnalyticsData = {
  totalUsed: string;
  totalUsedBytes: number;
  fileCountsByType: { fileType: string; count: number }[];
  compressionSavings: string;
  compressionSavingsBytes: number;
};

function barColor(percent: number): string {
  if (percent >= 90) return "bg-red-500 dark:bg-red-500";
  if (percent >= 70) return "bg-amber-500 dark:bg-amber-500";
  return "bg-emerald-500 dark:bg-emerald-500";
}

export function StoragePageContent() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // On success=true: show message only. Do NOT unlock here — webhook confirms payment and upgrades storage.
  useEffect(() => {
    const success = new URLSearchParams(window.location.search).get("success");
    if (success !== "true") return;

    setShowPaymentSuccess(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    url.searchParams.delete("cancel");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/storage/status", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/storage/analytics?scope=user", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([s, a]) => {
        if (!cancelled) {
          if (s.used != null) setStatus(s);
          if (a.totalUsed != null) setAnalytics(a);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // When user sees payment success, refetch storage so they see updated limit after webhook has run
  useEffect(() => {
    if (!showPaymentSuccess) return;
    Promise.all([
      fetch("/api/storage/status", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/storage/analytics?scope=user", { credentials: "same-origin" }).then((r) => r.json()),
    ]).then(([s, a]) => {
      if (s.used != null) setStatus(s);
      if (a.totalUsed != null) setAnalytics(a);
    });
  }, [showPaymentSuccess]);

  if (loading) {
    return (
      <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Loading storage…
      </div>
    );
  }

  const percent = status ? Math.min(100, status.percent) : 0;
  const totalFiles = analytics?.fileCountsByType?.reduce((s, x) => s + x.count, 0) ?? 0;
  const totalImages = analytics?.fileCountsByType?.find((x) => x.fileType === "image")?.count ?? 0;
  const totalDocuments = analytics?.fileCountsByType?.find((x) => x.fileType === "document")?.count ?? 0;

  return (
    <div className="mt-6 space-y-6">
      {showPaymentSuccess && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/30">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">Payment successful</p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            Your payment was received. Your upgrade will be applied shortly — refresh this page to see your new storage limit.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPaymentSuccess(false)}
              className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Dismiss
            </button>
            <Link
              href="/dashboard/billing"
              className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              View billing &amp; invoices
            </Link>
          </div>
        </div>
      )}
      <StorageAlert />
      <AiInsights />

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Usage</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {status ? `${status.used} / ${status.limit} (${percent}%)` : "0B / 0B (0%)"}
        </p>
        <div
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-[width] ${barColor(percent)}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          [{"█".repeat(Math.round(percent / 10))}{"░".repeat(10 - Math.round(percent / 10))}] {status?.used ?? "0B"} / {status?.limit ?? "0B"}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Analytics</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Total files</p>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{totalFiles}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Total images</p>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{totalImages}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Total documents</p>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{totalDocuments}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Compression savings</p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              {analytics?.compressionSavings ?? "0B"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Cleanup suggestions</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>• Delete unused images to free space.</li>
          <li>• Compress large files to reduce usage.</li>
          <li>• Archive inactive listings to lower storage.</li>
        </ul>
        <Link
          href="/dashboard/storage/trash"
          className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          View trash →
        </Link>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/billing"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          Upgrade plan
        </Link>
        <Link
          href="/dashboard/storage/trash"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clean unused files
        </Link>
        <Link
          href="/dashboard/listings"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Back to listings
        </Link>
      </div>
    </div>
  );
}
