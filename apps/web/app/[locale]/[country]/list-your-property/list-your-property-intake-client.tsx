"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { INTAKE_MAX_FILES, INTAKE_MAX_PHOTOS } from "@/lib/listing-acquisition/intake-limits";
import { useSuppressFooterHistoryNav } from "@/components/layout/FooterHistoryNavContext";

const PERMISSION_LABEL =
  "I declare, to the best of my knowledge, that I have the authority to publish this listing and the materials submitted; that the description and media are provided under my responsibility in accordance with applicable requirements; and that I am not reproducing third-party listing content without authorization.";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-premium-gold/45 focus:outline-none focus:ring-2 focus:ring-premium-gold/20";
const labelClass = "block text-sm font-medium text-slate-300";

export function ListYourPropertyIntakeClient() {
  useSuppressFooterHistoryNav(true);
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [sourceType, setSourceType] = useState<"OWNER" | "BROKER" | "HOST">("OWNER");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [city, setCity] = useState("");
  const [propertyCategory, setPropertyCategory] = useState("");
  const [priceCad, setPriceCad] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [description, setDescription] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [permission, setPermission] = useState(false);

  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [intakeCode, setIntakeCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSelected = useMemo(() => {
    const idn = identityFile ? 1 : 0;
    return idn + photoFiles.length + documentFiles.length;
  }, [identityFile, photoFiles.length, documentFiles.length]);

  useEffect(() => {
    const maxDocs = Math.max(0, INTAKE_MAX_FILES - 1 - photoFiles.length);
    setDocumentFiles((prev) => (prev.length > maxDocs ? prev.slice(0, maxDocs) : prev));
  }, [photoFiles.length]);

  const step1Error = useMemo(() => {
    if (!identityFile) return "Upload one government-issued identification file (PDF or image).";
    if (photoFiles.length < 1 || photoFiles.length > INTAKE_MAX_PHOTOS) {
      return `Add between 1 and ${INTAKE_MAX_PHOTOS} property photos.`;
    }
    if (totalSelected > INTAKE_MAX_FILES) {
      return `Maximum ${INTAKE_MAX_FILES} files total (ID + photos + documents).`;
    }
    return null;
  }, [identityFile, photoFiles.length, totalSelected]);

  function onPickIdentity(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setIdentityFile(f ?? null);
  }

  function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setPhotoFiles(list.slice(0, INTAKE_MAX_PHOTOS));
  }

  function onPickDocuments(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    const maxDocs = Math.max(0, INTAKE_MAX_FILES - 1 - photoFiles.length);
    setDocumentFiles(list.slice(0, maxDocs));
  }

  function goStep2() {
    if (step1Error) {
      setStatus("err");
      setMessage(step1Error);
      return;
    }
    setStatus("idle");
    setMessage("");
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identityFile || step1Error) {
      setStatus("err");
      setMessage(step1Error ?? "Complete file uploads first.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");
    setIntakeCode(null);

    const form = new FormData();
    form.set("sourceType", sourceType);
    form.set("contactName", contactName);
    form.set("contactEmail", contactEmail);
    if (contactPhone) form.set("contactPhone", contactPhone);
    form.set("city", city);
    form.set("propertyCategory", propertyCategory);
    if (priceCad.trim()) form.set("priceCad", priceCad);
    if (bedrooms) form.set("bedrooms", bedrooms);
    if (bathrooms) form.set("bathrooms", bathrooms);
    form.set("description", description);
    if (amenitiesText) form.set("amenitiesText", amenitiesText);
    if (sourceNote) form.set("sourcePlatformText", sourceNote);
    form.set("permissionConfirm", permission ? "true" : "false");

    form.set("identity", identityFile);
    for (const p of photoFiles) {
      form.append("photos", p);
    }
    for (const d of documentFiles) {
      form.append("documents", d);
    }

    try {
      const res = await fetch("/api/listing-acquisition/intake", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        intakeCode?: string;
        fsboListingId?: string;
        dashboardLinked?: boolean;
      };
      if (!res.ok) {
        setStatus("err");
        setMessage(typeof data.error === "string" ? data.error : "Could not submit");
        return;
      }
      setStatus("ok");
      const code = typeof data.intakeCode === "string" ? data.intakeCode : null;
      setIntakeCode(code);
      if (data.dashboardLinked && typeof data.fsboListingId === "string") {
        router.push(`/dashboard/seller/listings/${data.fsboListingId}`);
        return;
      }
      setMessage(
        "Your package is queued for automated AI intake: classification, media checks, and readiness scoring against broker desk standards. Save your reference code below. Sign in with the same email to open Seller Hub and revise price or particulars when your draft is linked."
      );
    } catch {
      setStatus("err");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ok" && intakeCode != null && intakeCode !== "" && !loading) {
    return (
      <div className="mx-auto max-w-lg space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgb(0_0_0/0.35)] backdrop-blur-sm sm:p-8">
        <p className="text-sm font-semibold text-emerald-300/95">Intake received — AI processing</p>
        <p className="text-sm leading-relaxed text-slate-300">{message}</p>
        <div className="rounded-xl border border-premium-gold/30 bg-black/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-premium-gold/90">Your listing reference (F-…)</p>
          <p className="mt-2 font-mono text-lg text-white">{intakeCode}</p>
          <p className="mt-2 text-xs text-slate-500">
            Retain this code for your records. It ties your file to automated workflows — not a manual desk. When you
            sign in with the same email, use{" "}
            <Link href="/auth/login?next=/dashboard/seller/listings" className="text-premium-gold underline-offset-2 hover:underline">
              Seller Hub
            </Link>{" "}
            to adjust price, particulars, and declarations. Formal instruments and admin drafting materials are held
            outside this public flow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-lg space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgb(0_0_0/0.35)] backdrop-blur-sm sm:p-8"
    >
      <p className="text-sm leading-relaxed text-slate-400">
        Use only content and media you are entitled to publish. The platform runs automated checks on every upload.
      </p>

      {step === 1 ? (
        <>
          <div className="border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-premium-gold/85">Step 1 of 2</p>
            <h2 className="mt-2 font-serif text-xl text-white">Authority, visuals & supporting file</h2>
            <p className="mt-1 text-xs text-slate-500">
              AI classifies and validates uploads (identity evidence, marketing photos, optional supporting documents).
              Maximum {INTAKE_MAX_FILES} files: one government-issued ID, up to {INTAKE_MAX_PHOTOS} property photos, then
              PDF or image exhibits as needed.
            </p>
          </div>

          <div>
            <label className={labelClass}>Government-issued identification (required)</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-premium-gold/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black`}
              onChange={onPickIdentity}
            />
          </div>

          <div>
            <label className={labelClass}>Property photographs (required, 1–{INTAKE_MAX_PHOTOS})</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-premium-gold/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black`}
              onChange={onPickPhotos}
            />
            <p className="mt-1 text-xs text-slate-500">{photoFiles.length} photo(s) selected</p>
          </div>

          <div>
            <label className={labelClass}>Supporting documents (optional)</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              multiple
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-premium-gold/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black`}
              onChange={onPickDocuments}
            />
            <p className="mt-1 text-xs text-slate-500">
              {documentFiles.length} document(s) selected · {totalSelected} / {INTAKE_MAX_FILES} files
            </p>
          </div>

          {status === "err" ? <p className="text-sm text-red-400">{message}</p> : null}

          <button
            type="button"
            onClick={goStep2}
            className="w-full min-h-[48px] rounded-xl bg-premium-gold px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-900/20 transition hover:brightness-110"
          >
            Save and continue — contact & property particulars
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-premium-gold/85">Step 2 of 2</p>
              <h2 className="mt-2 font-serif text-xl text-white">Contact & property particulars</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setStatus("idle");
                setMessage("");
              }}
              className="text-xs font-medium text-premium-gold/90 hover:underline"
            >
              ← Back to uploads
            </button>
          </div>

          <div>
            <label className={labelClass}>I am a</label>
            <select
              className={`${inputClass} appearance-none bg-black/60`}
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as typeof sourceType)}
            >
              <option value="OWNER">Property owner (sale / long-term rent)</option>
              <option value="BROKER">Broker / agent</option>
              <option value="HOST">Short-term host (BNHUB)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Name</label>
            <input
              required
              className={inputClass}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              required
              type="email"
              className={inputClass}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Phone (optional)</label>
            <input className={inputClass} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>City / area</label>
            <input required className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Property type</label>
            <input
              required
              placeholder="e.g. Condo, single-family, cottage…"
              className={inputClass}
              value={propertyCategory}
              onChange={(e) => setPropertyCategory(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Price (CAD, optional)</label>
            <input
              className={inputClass}
              value={priceCad}
              onChange={(e) => setPriceCad(e.target.value)}
              placeholder="e.g. 549000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Bedrooms</label>
              <input className={inputClass} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Bathrooms</label>
              <input className={inputClass} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Property summary (your own words)</label>
            <textarea
              required
              minLength={20}
              rows={5}
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Material facts in your own wording — do not paste text or data from another brokerage or portal without rights to reuse."
            />
          </div>
          <div>
            <label className={labelClass}>Amenities (optional)</label>
            <textarea rows={2} className={inputClass} value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Source note (optional, internal routing)</label>
            <input
              className={inputClass}
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              placeholder="e.g. referral name — not a link to a third-party listing"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-premium-gold/80">Publication attestation</p>
            <label className="mt-2 flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-black/50 text-premium-gold focus:ring-premium-gold/40"
                checked={permission}
                onChange={(e) => setPermission(e.target.checked)}
              />
              <span>{PERMISSION_LABEL}</span>
            </label>
          </div>

          {status === "err" ? <p className="text-sm text-red-400">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-premium-gold px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-900/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Submit for AI intake"}
          </button>
        </>
      )}
    </form>
  );
}
