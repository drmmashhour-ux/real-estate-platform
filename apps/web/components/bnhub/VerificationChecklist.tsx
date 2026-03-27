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
};

export function VerificationChecklist({
  listingId,
  onStatusLoad,
  compact = false,
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
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Loading verification status…
      </div>
    );
  }

  const { owner, property } = data;
  const ownerComplete = owner.overall === "verified";
  const propertyComplete = property ? property.canPublish : true;
  const canPublish = ownerComplete && propertyComplete;

  function Check({ done, rejected }: { done: boolean; rejected?: boolean }) {
    if (rejected)
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </span>
      );
    if (done)
      return (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          ✓
        </span>
      );
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        —
      </span>
    );
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <p className="font-medium text-slate-700">Publish requirements</p>
        <p className={canPublish ? "text-emerald-600" : "text-amber-600"}>
          {canPublish
            ? "All requirements met. You can publish."
            : "Complete the items below to publish."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">
        Mandatory verification
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Complete all steps before publishing a listing.
      </p>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">Owner</p>
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
                <Link
                  href="/bnhub/verify-id"
                  className="text-blue-600 hover:underline"
                >
                  Submit ID
                </Link>
              )}
              {owner.idVerificationStatus === "rejected" && (
                <span className="text-red-600">Rejected</span>
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
                  className="text-blue-600 hover:underline disabled:opacity-50"
                >
                  {confirmingOwnership ? "Confirming…" : "Confirm now"}
                </button>
              )}
            </span>
          </li>
        </ul>
      </div>

      {property && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">Property</p>
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
        <p className="mt-4 text-xs text-slate-500">
          {owner.reasons.slice(0, 3).join(". ")}
        </p>
      )}
    </div>
  );
}
