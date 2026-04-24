"use client";

import { useState } from "react";
import type { ComplaintIntake } from "@/modules/complaints/schemas/complaint-intake.schema";

export type ComplaintIntakeFormProps = {
  onSubmit: (draft: ComplaintIntake) => Promise<void> | void;
  defaultAgencyId?: string;
};

export function ComplaintIntakeForm({ onSubmit, defaultAgencyId }: ComplaintIntakeFormProps) {
  const [complainantName, setComplainantName] = useState("");
  const [complainantEmail, setComplainantEmail] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [complainantRelation, setComplainantRelation] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedBrokerId, setRelatedBrokerId] = useState("");
  const [relatedEmployeeId, setRelatedEmployeeId] = useState("");
  const [relatedListingId, setRelatedListingId] = useState("");
  const [relatedDealId, setRelatedDealId] = useState("");
  const [preferredResolution, setPreferredResolution] = useState("");
  const [consent, setConsent] = useState(false);
  const [evidenceIds, setEvidenceIds] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!complainantName.trim() || !subject.trim() || !description.trim()) {
      setError("Name, subject, and description are required.");
      return;
    }
    if (!consent) {
      setError("Consent to be contacted is required to proceed.");
      return;
    }
    const intake: ComplaintIntake = {
      complaintId: "",
      submittedAt: new Date().toISOString(),
      complainantName: complainantName.trim(),
      complainantEmail: complainantEmail.trim() || undefined,
      complainantPhone: complainantPhone.trim() || undefined,
      complainantRelation: complainantRelation.trim() || undefined,
      subject: subject.trim(),
      description: description.trim(),
      relatedBrokerId: relatedBrokerId.trim() || undefined,
      relatedEmployeeId: relatedEmployeeId.trim() || undefined,
      relatedListingId: relatedListingId.trim() || undefined,
      relatedDealId: relatedDealId.trim() || undefined,
      preferredResolution: preferredResolution.trim() || undefined,
      evidenceDocumentIds: evidenceIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      consentToBeContacted: true,
    };
    await onSubmit(intake);
  }

  return (
    <div className="grid gap-4 max-w-2xl text-white">
      {defaultAgencyId ? (
        <p className="text-xs text-gray-500">Agency scope: {defaultAgencyId}</p>
      ) : null}
      {error ? <p className="text-sm text-amber-400">{error}</p> : null}
      <input
        className="bg-black border border-gray-700 p-3 rounded"
        placeholder="Complainant name"
        value={complainantName}
        onChange={(e) => setComplainantName(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded"
        placeholder="Email"
        value={complainantEmail}
        onChange={(e) => setComplainantEmail(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded"
        placeholder="Phone"
        value={complainantPhone}
        onChange={(e) => setComplainantPhone(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded"
        placeholder="Relation to transaction (e.g. buyer)"
        value={complainantRelation}
        onChange={(e) => setComplainantRelation(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className="bg-black border border-gray-700 p-3 rounded min-h-[120px]"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded font-mono text-sm"
        placeholder="Related broker user id"
        value={relatedBrokerId}
        onChange={(e) => setRelatedBrokerId(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded font-mono text-sm"
        placeholder="Related employee user id"
        value={relatedEmployeeId}
        onChange={(e) => setRelatedEmployeeId(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded font-mono text-sm"
        placeholder="Related listing id"
        value={relatedListingId}
        onChange={(e) => setRelatedListingId(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded font-mono text-sm"
        placeholder="Related deal id"
        value={relatedDealId}
        onChange={(e) => setRelatedDealId(e.target.value)}
      />
      <textarea
        className="bg-black border border-gray-700 p-3 rounded"
        placeholder="Preferred resolution (optional)"
        value={preferredResolution}
        onChange={(e) => setPreferredResolution(e.target.value)}
      />
      <input
        className="bg-black border border-gray-700 p-3 rounded font-mono text-sm"
        placeholder="Evidence document ids (comma-separated)"
        value={evidenceIds}
        onChange={(e) => setEvidenceIds(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I consent to be
        contacted about this complaint.
      </label>
      <button
        type="button"
        className="rounded-lg bg-[#D4AF37] text-black px-4 py-2 font-medium"
        onClick={() => void handleSubmit()}
      >
        Submit intake
      </button>
    </div>
  );
}
