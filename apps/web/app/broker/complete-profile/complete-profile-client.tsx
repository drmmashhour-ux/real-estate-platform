"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LICENSE_MANUAL_REVIEW_WARNING,
  validateLicenseFormat,
} from "@/lib/broker/licenseValidation";
import {
  IDENTITY_LEADS_REQUIRED_WARNING,
  IDENTITY_MANUAL_REVIEW_DISCLAIMER,
} from "@/modules/mortgage/services/broker-verification";
import { useToast } from "@/components/ui/ToastProvider";

type Initial = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  licenseNumber: string;
  yearsExperience: string;
  specialties: string;
  insuranceProvider: string;
  references: string;
  idDocumentUrl: string;
  selfiePhotoUrl: string;
};

export function CompleteProfileClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rejected = searchParams.get("rejected") === "1";
  const identityRejected = searchParams.get("identity_rejected") === "1";
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [company, setCompany] = useState(initial.company);
  const [licenseNumber, setLicenseNumber] = useState(initial.licenseNumber);
  const [yearsExperience, setYearsExperience] = useState(initial.yearsExperience);
  const [specialties, setSpecialties] = useState(initial.specialties);
  const [insuranceProvider, setInsuranceProvider] = useState(initial.insuranceProvider);
  const [insuranceValid, setInsuranceValid] = useState(false);
  const [references, setReferences] = useState(initial.references);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [licenseAssistLabel, setLicenseAssistLabel] = useState<string | null>(null);
  const [licenseAssistLoading, setLicenseAssistLoading] = useState(false);
  const [idDocUrl, setIdDocUrl] = useState(initial.idDocumentUrl);
  const [selfieUrl, setSelfieUrl] = useState(initial.selfiePhotoUrl);
  const [idUploading, setIdUploading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [identityLastAssist, setIdentityLastAssist] = useState<string | null>(null);

  async function uploadIdentityFile(kind: "id" | "selfie", file: File | null) {
    if (!file) return;
    if (kind === "id") setIdUploading(true);
    else setSelfieUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", kind);
      const res = await fetch("/api/broker/identity-documents", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        idDocumentUrl?: string | null;
        selfiePhotoUrl?: string | null;
        assist?: { notes?: string } | null;
      };
      if (!res.ok) {
        showToast(json.error ?? "Could not upload image", "info");
        return;
      }
      if (json.idDocumentUrl) setIdDocUrl(json.idDocumentUrl);
      if (json.selfiePhotoUrl) setSelfieUrl(json.selfiePhotoUrl);
      const assistNotes =
        json.assist && typeof json.assist === "object" && "notes" in json.assist
          ? (json.assist as { notes?: string }).notes
          : undefined;
      setIdentityLastAssist(assistNotes ?? null);
      router.refresh();
    } finally {
      setIdUploading(false);
      setSelfieUploading(false);
    }
  }

  useEffect(() => {
    const fmt = validateLicenseFormat(licenseNumber);
    if (!fmt.valid) {
      setLicenseAssistLabel(null);
      setLicenseAssistLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      void (async () => {
        setLicenseAssistLoading(true);
        try {
          const res = await fetch("/api/broker/license-assess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ license: licenseNumber }),
            signal: ctrl.signal,
          });
          const j = (await res.json().catch(() => ({}))) as { assist?: string | null };
          if (j.assist === "looks_valid") setLicenseAssistLabel("Looks valid");
          else if (j.assist === "suspicious") setLicenseAssistLabel("Suspicious format");
          else setLicenseAssistLabel(null);
        } catch {
          if (!ctrl.signal.aborted) setLicenseAssistLabel(null);
        } finally {
          if (!ctrl.signal.aborted) setLicenseAssistLoading(false);
        }
      })();
    }, 450);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
      setLicenseAssistLoading(false);
    };
  }, [licenseNumber]);

  useEffect(() => {
    setIdDocUrl(initial.idDocumentUrl);
    setSelfieUrl(initial.selfiePhotoUrl);
  }, [initial.idDocumentUrl, initial.selfiePhotoUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idDocUrl.trim() || !selfieUrl.trim()) {
      showToast("Upload a government ID and a selfie (JPEG or PNG) before submitting.", "info");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/broker/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName,
          phone,
          company,
          licenseNumber,
          yearsExperience: yearsExperience === "" ? null : Number(yearsExperience),
          specialties,
          insuranceProvider,
          insuranceValid,
          references,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        showToast(json.error ?? "Could not save profile", "info");
        return;
      }

      if (photoFile) {
        const fd = new FormData();
        fd.set("file", photoFile);
        const up = await fetch("/api/broker/profile-photo", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!up.ok) {
          showToast("Profile saved; photo upload failed. You can try again from support.", "info");
        }
      }

      showToast("Profile submitted for review.", "success");
      router.push("/broker/pending-review");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder:text-slate-600";

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {rejected ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          Your previous submission was not approved. Update your details and resubmit for review.
        </div>
      ) : null}
      {identityRejected ? (
        <div className="rounded-xl border border-orange-500/40 bg-orange-950/30 px-4 py-3 text-sm text-orange-100">
          Your identity documents were not accepted. Please upload a clear government ID and a new selfie.
        </div>
      ) : null}

      <p className="text-sm text-slate-400">
        Signed in as <span className="text-slate-200">{initial.email}</span>
      </p>

      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Full name</label>
        <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Phone</label>
        <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Company</label>
        <input className={input} value={company} onChange={(e) => setCompany(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">License number</label>
        <input
          className={input}
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          required
          autoComplete="off"
          inputMode="text"
          pattern="[a-zA-Z0-9]{6,12}"
          title="6–12 letters or numbers only"
          maxLength={12}
        />
        <p className="mt-1 text-xs text-slate-500">6–12 characters, letters and numbers only.</p>
        {(() => {
          const fmt = validateLicenseFormat(licenseNumber);
          if (licenseNumber.trim() && !fmt.valid) {
            return <p className="mt-1 text-xs text-amber-200/90">{fmt.reason}</p>;
          }
          return null;
        })()}
        {validateLicenseFormat(licenseNumber).valid ? (
          <p className="mt-1 text-xs text-slate-400">
            {licenseAssistLoading ? "Checking format hint…" : licenseAssistLabel ?? "\u00a0"}
          </p>
        ) : null}
        <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
          {LICENSE_MANUAL_REVIEW_WARNING}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#14110a]/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]/90">Identity verification</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{IDENTITY_MANUAL_REVIEW_DISCLAIMER}</p>
        <p className="mt-2 text-xs font-medium text-amber-100/90">{IDENTITY_LEADS_REQUIRED_WARNING}</p>
        <div className="mt-4">
          <label className="text-xs font-semibold text-[#C9A646]/90">Government ID (passport or driver license)</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={idUploading}
            className="mt-1 w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#C9A646] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0B0B0B]"
            onChange={(e) => void uploadIdentityFile("id", e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-slate-500">JPEG or PNG · max 5 MB</p>
          {idDocUrl ? (
            <p className="mt-2 text-xs text-emerald-200/90">ID uploaded.</p>
          ) : (
            <p className="mt-2 text-xs text-amber-200/80">Required before you can submit.</p>
          )}
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-[#C9A646]/90">Selfie photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={selfieUploading}
            className="mt-1 w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#C9A646] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0B0B0B]"
            onChange={(e) => void uploadIdentityFile("selfie", e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-slate-500">JPEG or PNG · max 5 MB</p>
          {selfieUrl ? (
            <p className="mt-2 text-xs text-emerald-200/90">Selfie uploaded.</p>
          ) : (
            <p className="mt-2 text-xs text-amber-200/80">Required before you can submit.</p>
          )}
        </div>
        {identityLastAssist ? (
          <p className="mt-3 text-xs text-slate-500">Hint (non-binding): {identityLastAssist}</p>
        ) : null}
      </div>

      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Years of experience</label>
        <input
          className={input}
          type="number"
          min={0}
          max={80}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Specialties</label>
        <input
          className={input}
          placeholder="e.g. residential, commercial, first-time buyers"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Insurance provider</label>
        <input className={input} value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={insuranceValid}
          onChange={(e) => setInsuranceValid(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 accent-[#C9A646]"
        />
        Professional liability / E&amp;O insurance is current
      </label>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Professional references</label>
        <textarea
          className={`${input} min-h-[100px]`}
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          placeholder="Names, firms, or contact context (text)"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#C9A646]/90">Profile photo</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#C9A646] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0B0B0B]"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP · max 2.5 MB</p>
      </div>

      <p className="rounded-xl border border-white/10 bg-[#14110a]/80 px-3 py-2 text-xs leading-relaxed text-slate-400">
        This platform connects clients with brokers. All professionals must comply with AMF regulations.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit for verification"}
      </button>
    </form>
  );
}
