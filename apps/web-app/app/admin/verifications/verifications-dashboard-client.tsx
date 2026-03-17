"use client";

import { useState } from "react";

type DocumentExtraction = {
  id: string;
  cadastreNumber: string | null;
  ownerName: string | null;
  propertyAddress: string | null;
  municipality: string | null;
  lotNumber: string | null;
  confidenceScore: number | null;
  extractedAt: Date;
};
type VerificationMatch = {
  cadastreMatch: string;
  addressMatch: string;
  ownerMatch: string;
  overallStatus: string;
  verificationScore: number;
  checkedAt: Date;
} | null;
type Doc = {
  id: string;
  documentType: string;
  fileUrl: string;
  cadastreNumber: string | null;
  ownerName: string | null;
  documentExtractions: DocumentExtraction[];
};
type Verification = {
  id: string;
  cadastreNumber: string;
  verificationStatus: string;
  verifiedById: string | null;
  verifiedAt: Date | null;
  notes: string | null;
} | null;
type IdentityVerification = {
  id: string;
  governmentIdFileUrl: string | null;
  selfiePhotoUrl: string | null;
  verificationStatus: string;
};
type BrokerVerification = {
  id: string;
  licenseNumber: string;
  brokerageCompany: string;
  verificationStatus: string;
};
type LocationValidation = {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  validationStatus: string;
} | null;
type Owner = {
  id: string;
  name: string | null;
  email: string;
  identityVerifications: IdentityVerification[];
  brokerVerifications: BrokerVerification[];
};
type Listing = {
  id: string;
  title: string;
  address: string;
  city: string;
  municipality: string | null;
  province: string | null;
  cadastreNumber: string | null;
  listingAuthorityType: string | null;
  brokerLicenseNumber: string | null;
  brokerageName: string | null;
  listingVerificationStatus: string;
  submittedForVerificationAt: Date | null;
  owner: Owner;
  propertyDocuments: Doc[];
  propertyVerification: Verification;
  propertyLocationValidation: LocationValidation;
  verificationMatch: VerificationMatch;
  verificationFraudAlerts: { id: string; alertType: string; message: string; severity: string }[];
};

export function VerificationsDashboardClient({
  pendingListings,
  verifiedListings,
  rejectedListings,
}: {
  pendingListings: Listing[];
  verifiedListings: Listing[];
  rejectedListings: Listing[];
}) {
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [requestMoreReason, setRequestMoreReason] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, "approve" | "reject" | "request_more" | "run_ai">>({});
  const [aiRunning, setAiRunning] = useState<Record<string, boolean>>({});

  async function approve(listingId: string) {
    setLoading((prev) => ({ ...prev, [listingId]: "approve" }));
    try {
      const res = await fetch(`/api/admin/verifications/${listingId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setLoading((prev) => ({ ...prev, [listingId]: undefined }));
    }
  }

  async function reject(listingId: string) {
    const notes = rejectNotes[listingId] ?? "";
    setLoading((prev) => ({ ...prev, [listingId]: "reject" }));
    try {
      const res = await fetch(`/api/admin/verifications/${listingId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setLoading((prev) => ({ ...prev, [listingId]: undefined }));
    }
  }

  async function runAiExtraction(documentId: string) {
    setAiRunning((prev) => ({ ...prev, [documentId]: true }));
    try {
      const res = await fetch("/api/document-ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "AI analysis failed");
    } finally {
      setAiRunning((prev) => ({ ...prev, [documentId]: false }));
    }
  }

  async function requestMoreDocuments(listingId: string) {
    const reason = requestMoreReason[listingId] ?? "Please submit additional documents.";
    setLoading((prev) => ({ ...prev, [listingId]: "request_more" }));
    try {
      const res = await fetch(`/api/admin/verifications/${listingId}/request-more-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request documents");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to request documents");
    } finally {
      setLoading((prev) => ({ ...prev, [listingId]: undefined }));
    }
  }

  return (
    <section className="border-b border-slate-800 bg-slate-950/90">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-slate-200">Pending verification (triple: cadastre + identity + location)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Review land register document, identity verification, broker license (if broker), and map location. Then approve, reject, or request more documents.
        </p>
        {pendingListings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No listings pending verification.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {pendingListings.map((l) => (
              <li
                key={l.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-200">{l.title}</p>
                    <p className="text-sm text-slate-400">
                      {l.address}, {l.city}
                      {l.province && `, ${l.province}`}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Listing cadastre: <span className="font-mono text-slate-300">{l.cadastreNumber ?? "—"}</span>
                      {l.municipality && ` · ${l.municipality}`}
                    </p>
                    {l.verificationMatch && (
                      <p className="mt-1 text-xs">
                        <span className="text-slate-500">AI verification score: </span>
                        <span className={l.verificationMatch.verificationScore >= 80 ? "text-emerald-400" : l.verificationMatch.verificationScore >= 40 ? "text-amber-400" : "text-red-400"}>
                          {l.verificationMatch.verificationScore}/100
                        </span>
                        {" "}({l.verificationMatch.overallStatus.toLowerCase().replace("_", " ")})
                      </p>
                    )}
                    {l.verificationFraudAlerts?.length > 0 && (
                      <ul className="mt-1 list-inside list-disc text-xs text-amber-400">
                        {l.verificationFraudAlerts.map((a) => (
                          <li key={a.id}>{a.message}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Authority: {l.listingAuthorityType ?? "—"}
                      {l.listingAuthorityType === "BROKER" &&
                        l.brokerageName &&
                        ` · ${l.brokerageName}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Lister: {l.owner.name ?? l.owner.email}
                    </p>
                    {/* Identity verification */}
                    {l.owner.identityVerifications?.[0] && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="text-slate-500">Identity:</span>
                        {l.owner.identityVerifications[0].governmentIdFileUrl && (
                          <a href={l.owner.identityVerifications[0].governmentIdFileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Gov ID →</a>
                        )}
                        {l.owner.identityVerifications[0].selfiePhotoUrl && (
                          <a href={l.owner.identityVerifications[0].selfiePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Selfie →</a>
                        )}
                        <span className="text-slate-400">({l.owner.identityVerifications[0].verificationStatus})</span>
                      </div>
                    )}
                    {l.listingAuthorityType === "BROKER" && l.owner.brokerVerifications?.[0] && (
                      <p className="mt-1 text-xs text-slate-500">
                        Broker: {l.owner.brokerVerifications[0].licenseNumber} · {l.owner.brokerVerifications[0].brokerageCompany} ({l.owner.brokerVerifications[0].verificationStatus})
                      </p>
                    )}
                    {/* Map location */}
                    {l.propertyLocationValidation && (
                      <p className="mt-1 text-xs text-slate-500">
                        Location:{" "}
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${l.propertyLocationValidation.latitude}&mlon=${l.propertyLocationValidation.longitude}&zoom=16`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          View on map →
                        </a>
                        {" "}({l.propertyLocationValidation.validationStatus})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => approve(l.id)}
                      disabled={!!loading[l.id]}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {loading[l.id] === "approve" ? "…" : "Approve"}
                    </button>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Reject reason (optional)"
                        value={rejectNotes[l.id] ?? ""}
                        onChange={(e) =>
                          setRejectNotes((prev) => ({ ...prev, [l.id]: e.target.value }))
                        }
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-500"
                      />
                      <button
                        onClick={() => reject(l.id)}
                        disabled={!!loading[l.id]}
                        className="rounded-lg bg-red-600/80 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        {loading[l.id] === "reject" ? "…" : "Reject"}
                      </button>
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          placeholder="Reason for more documents"
                          value={requestMoreReason[l.id] ?? ""}
                          onChange={(e) =>
                            setRequestMoreReason((prev) => ({ ...prev, [l.id]: e.target.value }))
                          }
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-500"
                        />
                        <button
                          onClick={() => requestMoreDocuments(l.id)}
                          disabled={!!loading[l.id]}
                          className="rounded-lg bg-amber-600/80 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                        >
                          {loading[l.id] === "request_more" ? "…" : "Request more documents"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4">
                  {l.propertyDocuments.map((d) => {
                    const ext = d.documentExtractions?.[0];
                    return (
                      <div key={d.id} className="flex flex-col gap-1">
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          {d.documentType === "LAND_REGISTRY_EXTRACT"
                            ? "Land register extract"
                            : "Broker authorization"}{" "}
                          (PDF) →
                        </a>
                        {d.documentType === "LAND_REGISTRY_EXTRACT" && (
                          <>
                            {ext ? (
                              <div className="text-xs text-slate-400">
                                <p>Extracted: cadastre {ext.cadastreNumber ?? "—"}, owner {ext.ownerName ?? "—"}, address {ext.propertyAddress ?? "—"}</p>
                                <p>Confidence: {ext.confidenceScore != null ? `${(ext.confidenceScore * 100).toFixed(0)}%` : "—"}</p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => runAiExtraction(d.id)}
                                disabled={aiRunning[d.id]}
                                className="w-fit rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                              >
                                {aiRunning[d.id] ? "Running AI…" : "Run AI extraction"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-10 text-lg font-semibold text-slate-200">Recently verified</h2>
        {verifiedListings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            {verifiedListings.slice(0, 10).map((l) => (
              <li key={l.id}>
                {l.title} — {l.cadastreNumber ?? "—"} ·{" "}
                {l.propertyVerification?.verifiedAt
                  ? new Date(l.propertyVerification.verifiedAt).toLocaleString()
                  : "—"}
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-10 text-lg font-semibold text-slate-200">Recently rejected</h2>
        {rejectedListings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            {rejectedListings.slice(0, 10).map((l) => (
              <li key={l.id}>
                {l.title} — {l.propertyVerification?.notes ?? "No reason"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
