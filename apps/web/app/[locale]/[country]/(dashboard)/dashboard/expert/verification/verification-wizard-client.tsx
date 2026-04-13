"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Expert = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  photo: string | null;
  licenseNumber: string | null;
  idDocumentType: string | null;
  idDocumentPath: string | null;
  expertVerificationStatus: string;
};

const ID_OPTIONS: { value: string; label: string }[] = [
  { value: "qc_drivers_license", label: "Québec driver’s licence" },
  { value: "canadian_passport", label: "Canadian passport" },
  { value: "pr_card", label: "Canadian permanent resident card" },
  { value: "other_government_photo_id", label: "Other government photo ID" },
];

export function VerificationWizardClient() {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("");
  const [ampAttestation, setAmpAttestation] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/mortgage/expert/profile", { credentials: "same-origin" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Expert;
    setExpert(data);
    setName(data.name);
    setPhone(data.phone ?? "");
    setCompany(data.company ?? "");
    setTitle(data.title ?? "");
    setBio(data.bio ?? "");
    setLicenseNumber(data.licenseNumber ?? "");
    setIdDocumentType(data.idDocumentType ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setMsg(null);
    const res = await fetch("/api/mortgage/expert/photo", { method: "POST", body: fd, credentials: "same-origin" });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg({ type: "err", text: j.error ?? "Photo upload failed" });
      return;
    }
    setMsg({ type: "ok", text: "Photo uploaded." });
    await load();
    e.target.value = "";
  };

  const onId = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setMsg(null);
    const res = await fetch("/api/mortgage/expert/id-document", {
      method: "POST",
      body: fd,
      credentials: "same-origin",
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg({ type: "err", text: j.error ?? "ID upload failed" });
      return;
    }
    setMsg({ type: "ok", text: "ID document uploaded." });
    await load();
    e.target.value = "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/mortgage/expert/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          phone,
          company,
          title,
          bio,
          licenseNumber,
          idDocumentType,
          ampAttestation,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setMsg({ type: "err", text: j.error ?? "Submit failed" });
        return;
      }
      setMsg({ type: "ok", text: j.message ?? "Submitted for review." });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0f1419] p-12 text-center text-slate-400">
        Loading your application…
      </div>
    );
  }
  if (!expert) {
    return <p className="text-red-300">Could not load expert profile.</p>;
  }

  const st = expert.expertVerificationStatus;
  if (st === "verified") {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/25 p-8 text-center">
        <p className="text-lg font-semibold text-emerald-100">You are verified</p>
        <p className="mt-2 text-sm text-emerald-200/80">
          Your AMF licence and identity are on file. You can manage your public profile anytime.
        </p>
        <Link
          href="/dashboard/expert"
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-premium-gold px-8 py-3 text-sm font-bold text-[#0B0B0B]"
        >
          Open financing desk
        </Link>
      </div>
    );
  }

  if (st === "pending_review") {
    return (
      <div className="rounded-2xl border border-amber-500/35 bg-amber-950/20 p-8 text-center">
        <p className="text-lg font-semibold text-amber-100">Application under review</p>
        <p className="mt-2 text-sm text-amber-100/85">
          We are verifying your AMF mortgage broker licence and ID. You will receive email when approved. You can still
          open Billing and explore the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/expert"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Financing desk
          </Link>
          <Link
            href="/dashboard/expert/billing"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-[#0B0B0B]"
          >
            Billing
          </Link>
        </div>
      </div>
    );
  }

  const photoSrc = expert.photo;

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-[#1e2a3a] bg-gradient-to-br from-[#0f172a] via-[#0b1220] to-[#0a0f18] p-6 shadow-[0_0_60px_rgba(15,118,168,0.08)] sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400/90">Professional onboarding</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Mortgage broker verification</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          LECIPM lists only <strong className="text-slate-200">AMF-licensed</strong> mortgage brokers. Complete this
          application after sign-in: professional photo, government ID, and your{" "}
          <strong className="text-slate-200">AMF mortgage broker licence number</strong>. We cross-check against public
          registers before activating your public profile and lead routing.
        </p>
        <a
          href="https://www.lautorite.qc.ca/en/general-public/registers/register-of-firms-and-individuals-authorized-to-practice"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-xs font-semibold text-sky-400 hover:text-sky-300"
        >
          AMF — Register of authorized firms & individuals →
        </a>
      </div>

      {msg ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.type === "ok" ? "border border-emerald-500/40 bg-emerald-950/30 text-emerald-100" : "bg-red-950/40 text-red-200"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}

      {st === "rejected" ? (
        <p className="rounded-xl border border-red-500/40 bg-red-950/25 px-4 py-3 text-sm text-red-100">
          Your previous application could not be approved. Update your documents and details below, then submit again.
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-10">
        <section className="rounded-2xl border border-white/10 bg-[#0f1419] p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-premium-gold">1 · Professional photo</h2>
          <p className="mt-2 text-sm text-slate-400">Used on the public mortgage directory — clear face, business-appropriate.</p>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-sky-500/40 bg-black/40">
              {photoSrc ? (
                <Image src={photoSrc} alt="" fill className="object-cover" sizes="144px" unoptimized={photoSrc.startsWith("/uploads")} />
              ) : (
                <span className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-500">
                  No photo yet
                </span>
              )}
            </div>
            <label className="cursor-pointer rounded-xl border border-sky-500/50 bg-sky-950/30 px-5 py-3 text-sm font-semibold text-sky-100 hover:bg-sky-950/50">
              Upload JPEG / PNG / WebP
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f1419] p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-premium-gold">2 · Identity document</h2>
          <p className="mt-2 text-sm text-slate-400">
            Choose the ID you will upload. File must match your legal name (PDF or image, max 5 MB).
          </p>
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-300">ID type</label>
            <select
              value={idDocumentType}
              onChange={(e) => setIdDocumentType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              required
            >
              <option value="">Select…</option>
              {ID_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-white/20 bg-black/40 px-5 py-3 text-sm font-medium text-white hover:bg-white/5">
              {expert.idDocumentPath ? "Replace ID upload" : "Upload ID scan"}
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onId} />
            </label>
            {expert.idDocumentPath ? (
              <p className="mt-2 text-xs text-emerald-400/90">ID file on file ✓</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f1419] p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-premium-gold">3 · AMF licence & profile</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Legal name (as on AMF register) *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Phone *</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Brokerage / firm</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">AMF mortgage broker licence # *</label>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
                placeholder="As shown on your AMF certificate"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Public title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Residential mortgage broker"
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Professional bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-premium-gold/30 bg-[#14110a]/50 p-6 sm:p-8">
          <label className="flex cursor-pointer gap-3 text-sm leading-relaxed text-slate-200">
            <input
              type="checkbox"
              checked={ampAttestation}
              onChange={(e) => setAmpAttestation(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-premium-gold"
            />
            <span>
              I confirm that I hold an <strong className="text-premium-gold">active mortgage broker licence</strong>{" "}
              issued or registered with the{" "}
              <strong className="text-white">Autorité des marchés financiers (AMF)</strong> in Québec, that the licence
              number above is accurate, and that I will notify LECIPM if my licence status changes.
            </span>
          </label>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 text-sm font-extrabold text-white shadow-lg shadow-sky-900/40 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit for verification"}
        </button>
      </form>
    </div>
  );
}
