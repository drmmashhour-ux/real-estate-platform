"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AccessState = {
  status: "no-trial" | "active" | "expired" | "paid";
  daysRemaining: number | null;
};

export function DesignAccessCta({ listingId }: { listingId: string }) {
  const [access, setAccess] = useState<AccessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch("/api/design/access", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status != null) {
          setAccess({ status: data.status, daysRemaining: data.daysRemaining ?? null });
        }
      })
      .catch(() => setAccess(null))
      .finally(() => setLoading(false));
  }, []);

  const canUseDesign = access && (access.status === "active" || access.status === "paid" || access.status === "no-trial");
  const expired = access?.status === "expired";

  if (loading) {
    return (
      <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Your trial expired — upgrade to continue
        </p>
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
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {checkoutLoading ? "Loading…" : "Upgrade ($5)"}
        </button>
      </div>
    );
  }

  return (
    <>
      {canUseDesign && access?.status === "active" && access.daysRemaining != null && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Trial ends in {access.daysRemaining} day{access.daysRemaining !== 1 ? "s" : ""}.
        </p>
      )}
      <Link
        href={`/design-templates?listingId=${encodeURIComponent(listingId)}`}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        Create design with Canva
      </Link>
    </>
  );
}
