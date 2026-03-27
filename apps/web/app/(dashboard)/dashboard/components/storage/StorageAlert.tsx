"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type StorageStatus = "safe" | "warning" | "critical" | "full";

type StatusData = {
  used: string;
  limit: string;
  percent: number;
  status: StorageStatus;
};

export function StorageAlert() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storage/status", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.status) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || !data || data.percent < 70) {
    return null;
  }

  if (data.percent >= 100) {
    return (
      <div
        className="rounded-lg border border-red-600 bg-red-100 px-4 py-3 text-sm font-medium text-red-900 dark:border-red-500 dark:bg-red-950/50 dark:text-red-100"
        role="alert"
      >
        ❌ Storage full — upgrade required
        <Link
          href="/dashboard/billing"
          className="ml-2 inline-block rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
        >
          Upgrade plan
        </Link>
      </div>
    );
  }

  if (data.percent >= 90) {
    return (
      <div
        className="rounded-lg border border-red-500/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        🚨 Almost full — upgrade now
        <Link
          href="/dashboard/billing"
          className="ml-2 font-medium underline hover:no-underline"
        >
          Upgrade plan
        </Link>
      </div>
    );
  }

  if (data.percent >= 70) {
    return (
      <div
        className="rounded-lg border border-amber-500/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200"
        role="alert"
      >
        ⚠️ You are using most of your storage
        <Link
          href="/dashboard/billing"
          className="ml-2 font-medium underline hover:no-underline"
        >
          Upgrade plan
        </Link>
      </div>
    );
  }

  return null;
}
