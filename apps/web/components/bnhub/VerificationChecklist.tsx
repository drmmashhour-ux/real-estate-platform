"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OwnerStatus = {
  fullNameProvided: boolean;
  idVerificationStatus: "pending" | "verified" | "rejected";
  ownershipConfirmationStatus: "pending" | "confirmed" | "rejected";
  overall: "pending" | "verified" | "rejected";
  reasons: string[];
};

type PropertyStatus = {
  hasAddress: boolean;
  hasImages: boolean;
  canPublish: boolean;
  reasons: string[];
};

type VerificationStatusResponse = {
  owner: OwnerStatus;
  property: PropertyStatus | null;
};

type Props = {
  listingId?: string;
  onStatusLoad?: (data: VerificationStatusResponse) => void;
  compact?: boolean;
  /** Dark panel for BNHUB host wizard / dashboards on slate backgrounds */
  tone?: "light" | "dark";
};

export function VerificationChecklist({
  listingId,
  onStatusLoad,
  compact = false,
  tone = "light",
}: Props) {
  const [data, setData] = useState<VerificationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingOwnership, setConfirmingOwnership] = useState(false);

  useEffect(() => {
    const url = listingId
      ? `/api/bnhub/verification/status?listingId=${encodeURIComponent(listingId)}`
      : "/api/bnhub/verification/status";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData(d);
          onStatusLoad?.(d);
        }
      })
      .finally(() => setLoading(false));
  }, [listingId, onStatusLoad]);

  async function handleConfirmOwnership() {
    setConfirmingOwnership(true);
    try {
      const res = await fetch("/api/bnhub/owner-verification/confirm-ownership", {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                owner: {
                  ...prev.owner,
                  ownershipConfirmationStatus: "confirmed",
                  overall:
                    prev.owner.fullNameProvided &&
                    prev.owner.idVerificationStatus === "verified"
                      ? "verified"
                      : prev.owner.overall,
                  reasons: prev.owner.reasons.filter(
                    (r) => !r.toLowerCase().includes("ownership confirmation")
                  ),
                },
              }
            : null
        );
      } else {
        alert(json.error ?? "Failed to confirm");
      }
    } finally {
      setConfirmingOwnership(false);
    }
  }

  if (loading || !data) {
    return (
      <div
        className={
          tone === "dark"
            ? "rounded-xl border border-white/15 bg-white/[0.06] p-4 text-sm text-slate-400"
            : "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500"
        }
      >
        Loading verification status…
      </div>
    );
  }

  const { owner, property } = data;
  const ownerComplete = owner.overall === "verified";
  const propertyComplete = property ? property.canPublish : true;
  const canPublish = ownerComplete && propertyComplete;

  const isDark = tone === "dark";

  function Check({ done, rejected }: { done: boolean; rejected?: boolean }) {
    if (rejected)
      return (
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
            isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-600"
          }`}
        >
          ✕
        </span>
      );
    if (done)
      return (
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
            isDark ? "bg-emerald-500/25 text-emerald-300" : "bg-emerald-100 text-emerald-600"
          }`}
        >
          ✓
        </span>
      );
    return (
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
          isDark ? "bg-amber-500/20 text-amber-200" : "bg-amber-100 text-amber-600"
        }`}
      >
        —
      </span>
    );
  }

  const linkClass = isDark ? "text-premium-gold hover:underline" : "text-blue-600 hover:underline";

  if (compact) {
    return (
      <div
        className={
          isDark
            ? "rounded-lg border border-white/15 bg-white/[0.06] p-3 text-sm text-slate-200"
            : "rounded-lg border border-slate-200 bg-white p-3 text-sm"
        }
      >
        <p className={`font-medium ${isDark ? "text-white" : "text-slate-700"}`}>Publish requirements</p>
        <p className={canPublish ? (isDark ? "text-emerald-400" : "text-emerald-600") : isDark ? "text-amber-300" : "text-amber-600"}>
          {canPublish
            ? "All requirements met. You can publish."
            : "Complete the items below to publish."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isDark
          ? "rounded-xl border border-white/15 bg-white/[0.06] p-5 text-slate-200"
          : "rounded-xl border border-slate-200 bg-white p-5"
      }
    >
      <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
        Mandatory verification
      </h3>
      <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Complete all steps before publishing a listing.
      </p>

      <div className="mt-4 space-y-3">
        <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>Owner</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Check done={owner.fullNameProvided} />
            <span>Full name</span>
          </li>
          <li className="flex items-center gap-2">
            <Check
              done={owner.idVerificationStatus === "verified"}
              rejected={owner.idVerificationStatus === "rejected"}
            />
            <span>
              ID verification{" "}
              {owner.idVerificationStatus === "pending" && (
                <Link href="/bnhub/verify-id" className={linkClass}>
                  Submit ID
                </Link>
              )}
              {owner.idVerificationStatus === "rejected" && (
                <span className={isDark ? "text-red-400" : "text-red-600"}>Rejected</span>
              )}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Check
              done={owner.ownershipConfirmationStatus === "confirmed"}
              rejected={owner.ownershipConfirmationStatus === "rejected"}
            />
            <span>
              Ownership confirmation{" "}
              {owner.ownershipConfirmationStatus === "pending" && (
                <button
                  type="button"
                  onClick={handleConfirmOwnership}
                  disabled={confirmingOwnership}
                  className={`${linkClass} disabled:opacity-50`}
                >
                  {confirmingOwnership ? "Confirming…" : "Confirm now"}
                </button>
              )}
            </span>
          </li>
        </ul>
      </div>

      {property && (
        <div className={`mt-4 space-y-3 border-t pt-4 ${isDark ? "border-white/10" : "border-slate-100"}`}>
          <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>Property</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check done={property.hasAddress} />
              <span>Address (street, city, country)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check done={property.hasImages} />
              <span>At least one image</span>
            </li>
          </ul>
        </div>
      )}

      {!canPublish && owner.reasons.length > 0 && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-xs ${
            isDark ? "bg-rose-500/15 text-rose-100" : "text-slate-500"
          }`}
        >
          {owner.reasons.slice(0, 3).join(". ")}
        </p>
      )}
    </div>
  );
}
