"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LICENSE_MANUAL_REVIEW_WARNING } from "@/lib/broker/licenseValidation";

export type MortgageBrokerRow = {
  id: string;
  fullName: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  licenseNumber: string;
  yearsExperience: number | null;
  specialties: string | null;
  profilePhotoUrl: string | null;
  idDocumentUrl: string | null;
  selfiePhotoUrl: string | null;
  insuranceProvider: string | null;
  insuranceValid: boolean | null;
  brokerReferences: string | null;
  verificationStatus: string;
  identityStatus: string;
  createdAt: string;
  user: { email: string } | null;
};

export function AdminMortgageBrokersClient({ brokers }: { brokers: MortgageBrokerRow[] }) {
  const router = useRouter();
  const [actioning, setActioning] = useState<string | null>(null);

  async function verifyLicense(id: string) {
    setActioning(`license:${id}`);
    try {
      const res = await fetch(`/api/admin/mortgage-brokers/${id}/approve`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setActioning(null);
    }
  }

  async function verifyIdentity(id: string) {
    setActioning(`identity:${id}`);
    try {
      const res = await fetch(`/api/admin/mortgage-brokers/${id}/verify-identity`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setActioning(null);
    }
  }

  async function rejectLicense(id: string) {
    if (!confirm("Reject this broker’s license / profile review?")) return;
    setActioning(`reject:${id}`);
    try {
      const res = await fetch(`/api/admin/mortgage-brokers/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Rejected by admin" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActioning(null);
    }
  }

  async function rejectIdentity(id: string) {
    if (!confirm("Reject identity documents? The broker must upload new ID and selfie.")) return;
    setActioning(`rejectId:${id}`);
    try {
      const res = await fetch(`/api/admin/mortgage-brokers/${id}/reject-identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Identity rejected by admin" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActioning(null);
    }
  }

  if (brokers.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">No mortgage broker profiles pending review.</p>;
  }

  return (
    <>
      <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs leading-relaxed text-slate-400">
        {LICENSE_MANUAL_REVIEW_WARNING}
      </p>
      <ul className="mt-4 space-y-6">
        {brokers.map((b) => (
          <li key={b.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                {b.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-100">{b.fullName ?? b.name}</p>
                <p className="text-sm text-slate-400">{b.email}</p>
                {b.user?.email && b.user.email !== b.email ? (
                  <p className="text-xs text-slate-500">Account: {b.user.email}</p>
                ) : null}
                <p className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span
                    className={
                      b.verificationStatus === "verified"
                        ? "rounded bg-emerald-950/80 px-2 py-0.5 text-emerald-200"
                        : "rounded bg-amber-950/80 px-2 py-0.5 text-amber-200"
                    }
                  >
                    License: {b.verificationStatus}
                  </span>
                  <span
                    className={
                      b.identityStatus === "verified"
                        ? "rounded bg-emerald-950/80 px-2 py-0.5 text-emerald-200"
                        : "rounded bg-amber-950/80 px-2 py-0.5 text-amber-200"
                    }
                  >
                    Identity: {b.identityStatus}
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Phone: {b.phone ?? "—"} · Company: {b.company ?? "—"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  License: <span className="font-mono text-slate-200">{b.licenseNumber || "—"}</span>
                  {b.yearsExperience != null ? ` · ${b.yearsExperience} yrs exp` : null}
                </p>
                {b.specialties ? (
                  <p className="mt-1 text-sm text-slate-400">Specialties: {b.specialties}</p>
                ) : null}
                {b.insuranceProvider ? (
                  <p className="mt-1 text-sm text-slate-500">
                    Insurance: {b.insuranceProvider}
                    {b.insuranceValid ? " (marked current)" : ""}
                  </p>
                ) : null}
                {b.brokerReferences ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">References: {b.brokerReferences}</p>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Government ID</p>
                    <div className="mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                      {b.idDocumentUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.idDocumentUrl} alt="ID document" className="max-h-48 w-full object-contain" />
                      ) : (
                        <p className="p-4 text-center text-xs text-slate-500">Not uploaded</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Selfie</p>
                    <div className="mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                      {b.selfiePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.selfiePhotoUrl} alt="Selfie" className="max-h-48 w-full object-contain" />
                      ) : (
                        <p className="p-4 text-center text-xs text-slate-500">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Submitted {new Date(b.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex w-full min-w-[200px] flex-col gap-2 sm:w-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">License</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!actioning}
                    onClick={() => verifyLicense(b.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {actioning === `license:${b.id}` ? "…" : "Verify manually"}
                  </button>
                  <button
                    type="button"
                    disabled={!!actioning}
                    onClick={() => rejectLicense(b.id)}
                    className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Identity</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!actioning || !b.idDocumentUrl || !b.selfiePhotoUrl}
                    onClick={() => verifyIdentity(b.id)}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                  >
                    {actioning === `identity:${b.id}` ? "…" : "Verify Identity"}
                  </button>
                  <button
                    type="button"
                    disabled={!!actioning}
                    onClick={() => rejectIdentity(b.id)}
                    className="rounded-lg border border-orange-800 bg-orange-950/50 px-3 py-1.5 text-sm font-medium text-orange-200 hover:bg-orange-900/50 disabled:opacity-50"
                  >
                    Reject Identity
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
