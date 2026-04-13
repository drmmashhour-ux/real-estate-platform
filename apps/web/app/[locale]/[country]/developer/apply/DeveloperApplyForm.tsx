"use client";

import { useState } from "react";
import Link from "next/link";

export function DeveloperApplyForm({
  defaultEmail,
  defaultPhone,
}: {
  defaultEmail: string;
  defaultPhone: string;
}) {
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [documentUrl, setDocumentUrl] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !registrationNumber.trim() || !email.trim()) {
      setError("Company name, registration number, and email are required.");
      return;
    }
    if (!acceptedTerms) {
      setError("You must accept the developer terms to apply.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/developer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          registrationNumber: registrationNumber.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          documentUrl: documentUrl.trim() || null,
          projectDetails: projectDetails.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-6">
        <p className="font-medium text-emerald-200">Application submitted</p>
        <p className="mt-2 text-sm text-slate-400">We will review your application and update your status. You can check back here or we will notify you by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <label className="block text-sm font-medium text-slate-400">Company name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">Registration number</label>
        <input
          type="text"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          placeholder="e.g. NEQ, provincial registration"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">Company / license document URL</label>
        <input
          type="url"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          placeholder="Paste link to uploaded document"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">Project details (optional)</label>
        <textarea
          value={projectDetails}
          onChange={(e) => setProjectDetails(e.target.value)}
          rows={3}
          placeholder="Brief description of projects you plan to list"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
        />
      </div>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="developer-terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 rounded border-slate-600 bg-slate-800"
        />
        <label htmlFor="developer-terms" className="text-sm text-slate-400">
          I accept the{" "}
          <Link href="/legal/developer-terms" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
            developer terms
          </Link>{" "}
          and confirm that the information provided is accurate.
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
