"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewComplaintPage() {
  const [agencyId, setAgencyId] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantEmail, setComplainantEmail] = useState("");
  const [complaintType, setComplaintType] = useState("service_issue");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [mentionsTrustMoney, setMentionsTrustMoney] = useState(false);
  const [mentionsFraud, setMentionsFraud] = useState(false);

  async function handleSubmit() {
    const res = await fetch("/api/complaints/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        complaintChannel: "internal",
        agencyId: agencyId.trim() || null,
        complainantName,
        complainantEmail,
        complaintType,
        summary,
        description,
        mentionsTrustMoney,
        mentionsFraud,
      }),
    });

    const data = (await res.json()) as { success?: boolean; error?: string; complaint?: { caseNumber: string } };

    if (!data.success) {
      alert(data.error || "Unable to create complaint");
      return;
    }

    alert(`Complaint created: ${data.complaint?.caseNumber ?? ""}`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#D4AF37]">New Complaint / Assistance Request</h1>
          <p className="text-sm text-gray-400 mt-2">
            Capture complaints, consumer protection issues, or public assistance needs. AI may assist with wording
            only — not final syndic or regulatory routing.
          </p>
        </div>
        <Link href="/dashboard/broker/complaints" className="text-sm text-gray-400 underline self-start">
          Back to complaints
        </Link>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <label className="text-xs text-gray-500 uppercase">Agency id (optional)</label>
        <input
          className="bg-black text-white border border-gray-700 p-3 font-mono text-sm"
          placeholder="Record under agency owner when set"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
        />

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Complainant name"
          value={complainantName}
          onChange={(e) => setComplainantName(e.target.value)}
        />

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Complainant email"
          value={complainantEmail}
          onChange={(e) => setComplainantEmail(e.target.value)}
        />

        <select
          className="bg-black text-white border border-gray-700 p-3"
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value)}
        >
          <option value="service_issue">Service issue</option>
          <option value="conduct_issue">Conduct issue</option>
          <option value="advertising_issue">Advertising issue</option>
          <option value="record_issue">Record issue</option>
          <option value="trust_money_issue">Trust money issue</option>
          <option value="fraud_risk">Fraud / suspicious situation</option>
          <option value="public_assistance">Public assistance request</option>
          <option value="other">Other</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={mentionsTrustMoney}
            onChange={(e) => setMentionsTrustMoney(e.target.checked)}
          />
          Mentions trust money (elevates review)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={mentionsFraud} onChange={(e) => setMentionsFraud(e.target.checked)} />
          Mentions fraud / serious misrepresentation (elevates review)
        </label>

        <input
          className="bg-black text-white border border-gray-700 p-3"
          placeholder="Short summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <textarea
          className="bg-black text-white border border-gray-700 p-3 min-h-[160px]"
          placeholder="Full description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="text-xs text-gray-400">
          Complaints involving fraud risk, trust money, or serious conduct concerns are flagged for accountable review
          and may route as syndic candidates. Public assistance requests follow consumer guidance workflows.
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          className="px-4 py-3 bg-[#D4AF37] text-black font-semibold"
        >
          Save complaint
        </button>
      </div>
    </div>
  );
}
