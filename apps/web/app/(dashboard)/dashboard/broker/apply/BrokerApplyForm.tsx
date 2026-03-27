"use client";

import { useState } from "react";

export function BrokerApplyForm({
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}) {
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [authority, setAuthority] = useState("OACIQ");
  const [documentUrl, setDocumentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !licenseNumber.trim()) {
      setError("Full name, email, and license number are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/broker/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          licenseNumber: licenseNumber.trim(),
          authority: authority.trim() || "OACIQ",
          documentUrl: documentUrl.trim() || null,
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
        <label className="block text-sm font-medium text-slate-400">Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
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
        <label className="block text-sm font-medium text-slate-400">License number</label>
        <input
          type="text"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">Issuing authority</label>
        <select
          value={authority}
          onChange={(e) => setAuthority(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100"
        >
          <option value="OACIQ">OACIQ (Quebec)</option>
          <option value="RECO">RECO (Ontario)</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-400">License document URL</label>
        <input
          type="url"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          placeholder="Paste link to uploaded license document"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
        />
        <p className="mt-1 text-xs text-slate-500">Upload your document elsewhere and paste the URL here, or leave blank to submit later.</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
