"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploader } from "@/components/fsbo/ImageUploader";
import { ContractModal } from "@/components/contracts/ContractModal";
import { SellerDocumentsPanel } from "@/components/seller/SellerDocumentsPanel";
import { FSBO_HUB_DOC_TYPES, FSBO_HUB_REQUIRED_DOC_TYPES } from "@/lib/fsbo/seller-hub-doc-types";
import { SellerDeclarationForm } from "@/components/seller/SellerDeclarationForm";
import {
  emptySellerDeclaration,
  isAdditionalDeclarationsSectionComplete,
  migrateLegacySellerDeclaration,
  type SellerDeclarationData,
} from "@/lib/fsbo/seller-declaration-schema";
import {
  parseSellerDeclarationAiReview,
  type SellerDeclarationAiReview,
} from "@/lib/fsbo/seller-declaration-ai-review";
import type { ListingAiScoresResult } from "@/lib/fsbo/listing-ai-scores";
import { getFsboMaxPhotosForSellerPlan, type FsboPhotoType } from "@/lib/fsbo/photo-limits";
import { ListingTrustGraphPanel } from "@/components/trust/ListingTrustGraphPanel";

function parseListingAiScoresFromApi(raw: unknown): ListingAiScoresResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const risk = o.riskScore;
  const trust = o.trustScore;
  if (typeof risk !== "number" || typeof trust !== "number") return null;
  const reasons = Array.isArray(o.reasons) ? o.reasons.filter((x): x is string => typeof x === "string") : [];
  return { riskScore: risk, trustScore: trust, reasons };
}

function listingScoresFromPayload(l: {
  riskScore?: number | null;
  trustScore?: number | null;
  aiScoreReasonsJson?: unknown;
}): ListingAiScoresResult | null {
  if (l.riskScore == null || l.trustScore == null) return null;
  const raw = l.aiScoreReasonsJson;
  const reasons = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  return { riskScore: l.riskScore, trustScore: l.trustScore, reasons };
}

const STEPS = [
  "Property info",
  "Property details",
  "Photos",
  "Seller declaration",
  "Documents",
  "Contracts",
  "Review & submit",
] as const;

const PROPERTY_TYPES = ["", "SINGLE_FAMILY", "CONDO", "TOWNHOUSE", "MULTI_FAMILY", "LAND", "COMMERCIAL"] as const;

type ListingPayload = {
  title: string;
  price: string;
  address: string;
  city: string;
  cadastreNumber: string;
  description: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  surfaceSqft: string;
  yearBuilt: string;
  annualTaxes: string;
  condoFees: string;
  images: string[];
  declaration: SellerDeclarationData;
};

const emptyDecl = emptySellerDeclaration();

export type SellerListingWizardTrustGraphProps = {
  listingBadge: boolean;
  declarationWidget: boolean;
};

export type SellerListingWizardProps = {
  /** When set (e.g. admin route segment), loads this listing without `?id=` */
  initialListingId?: string | null;
  createPath?: string;
  dashboardHref?: string;
  listingsHref?: string;
  pageTitle?: string;
  /** Gated by env — see `getTrustGraphFeatureFlags()` */
  trustGraph?: SellerListingWizardTrustGraphProps;
};

export function SellerListingWizard({
  initialListingId = null,
  createPath = "/dashboard/seller/create",
  dashboardHref = "/dashboard/seller",
  listingsHref = "/dashboard/seller/listings",
  pageTitle = "Create listing",
  trustGraph,
}: SellerListingWizardProps = {}) {
  const tg = trustGraph ?? { listingBadge: false, declarationWidget: false };
  const router = useRouter();
  const searchParams = useSearchParams();
  const qId = searchParams.get("id");
  const routeListingId = initialListingId ?? qId;

  const [listingId, setListingId] = useState<string | null>(routeListingId);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingPayload>({
    title: "",
    price: "",
    address: "",
    city: "",
    cadastreNumber: "",
    description: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    surfaceSqft: "",
    yearBuilt: "",
    annualTaxes: "",
    condoFees: "",
    images: [],
    declaration: { ...emptyDecl },
  });
  const [contracts, setContracts] = useState<{ id: string; type: string; title: string; status: string }[]>([]);
  const [modalId, setModalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [declarationSaveBusy, setDeclarationSaveBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [declarationAiReview, setDeclarationAiReview] = useState<SellerDeclarationAiReview | null>(null);
  const [listingAiScores, setListingAiScores] = useState<ListingAiScoresResult | null>(null);
  const [trustGraphEngineMetrics, setTrustGraphEngineMetrics] = useState<{
    contradictionCount: number;
    blockingIssuesCount: number;
  } | null>(null);
  const [photoTypes, setPhotoTypes] = useState<FsboPhotoType[]>([]);
  const [photoLimit, setPhotoLimit] = useState(5);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [photoVerificationStatus, setPhotoVerificationStatus] = useState<"PENDING" | "VERIFIED" | "FLAGGED">("PENDING");
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null);
  const [photoMismatchDetected, setPhotoMismatchDetected] = useState(false);
  const [photoSimilarityScore, setPhotoSimilarityScore] = useState<number | null>(null);

  const load = useCallback(async (id: string) => {
    const res = await fetch(`/api/fsbo/listings/${id}`, { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const l = data.listing;
    if (!l) return;
    setLegalAccepted(!!l.legalAccuracyAcceptedAt);
    setPhotoConfirmed(Boolean(l.photoConfirmationAcceptedAt));
    setPhotoVerificationStatus(
      typeof l.photoVerificationStatus === "string" && ["PENDING", "VERIFIED", "FLAGGED"].includes(l.photoVerificationStatus)
        ? (l.photoVerificationStatus as "PENDING" | "VERIFIED" | "FLAGGED")
        : "PENDING"
    );
    setDeclarationAiReview(parseSellerDeclarationAiReview(l.sellerDeclarationAiReviewJson ?? null));
    setListingAiScores(listingScoresFromPayload(l));
    const decl = migrateLegacySellerDeclaration(l.sellerDeclarationJson ?? null);
    const pa = decl.propertyAddressStructured;
    const hasStructured =
      (pa?.street?.trim() ?? "").length > 0 || (pa?.city?.trim() ?? "").length > 0;
    const declarationMerged: SellerDeclarationData = !hasStructured
      ? {
          ...decl,
          propertyAddressStructured: {
            street:
              typeof l.address === "string" && l.address.trim() && l.address !== "TBD" ? l.address.trim() : "",
            unit: "",
            city: typeof l.city === "string" && l.city.trim() && l.city !== "TBD" ? l.city.trim() : "",
            postalCode: "",
          },
        }
      : decl;
    setForm({
      title: l.title ?? "",
      price: l.priceCents ? String(l.priceCents / 100) : "",
      address: l.address ?? "",
      city: l.city ?? "",
      cadastreNumber: l.cadastreNumber ?? "",
      description: l.description ?? "",
      propertyType: l.propertyType ?? "",
      bedrooms: l.bedrooms != null ? String(l.bedrooms) : "",
      bathrooms: l.bathrooms != null ? String(l.bathrooms) : "",
      surfaceSqft: l.surfaceSqft != null ? String(l.surfaceSqft) : "",
      yearBuilt: l.yearBuilt != null ? String(l.yearBuilt) : "",
      annualTaxes: l.annualTaxesCents != null ? String(l.annualTaxesCents / 100) : "",
      condoFees: l.condoFeesCents != null ? String(l.condoFeesCents / 100) : "",
      images: Array.isArray(l.images) ? [...l.images] : [],
      declaration: declarationMerged,
    });

    const rawTags = l.photoTagsJson;
    const images = Array.isArray(l.images) ? (l.images as string[]) : [];
    const derived =
      Array.isArray(rawTags)
        ? rawTags.filter((t: unknown) => typeof t === "string").map((t: string) => t) // validated by defaults below
        : [];
    const normalized: FsboPhotoType[] =
      images.length > 0
        ? Array.from({ length: images.length }).map((_, i) => {
            const t = derived[i];
            const upper = typeof t === "string" ? t.toUpperCase() : "";
            const v = upper === "EXTERIOR" || upper === "INTERIOR" || upper === "STREET_VIEW" || upper === "OTHER" ? upper : "";
            return (v as FsboPhotoType) || (i === 0 ? "EXTERIOR" : "OTHER");
          })
        : [];
    if (normalized.length > 0) normalized[0] = "EXTERIOR";
    setPhotoTypes(normalized);
  }, []);

  const loadContracts = useCallback(async (id: string) => {
    const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/seller-contracts`, {
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.contracts)) {
      setContracts(data.contracts);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/me/marketplace", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const plan = typeof data?.sellerPlan === "string" ? data.sellerPlan : null;
        setPhotoLimit(getFsboMaxPhotosForSellerPlan(plan));
      } catch {
        // keep default
      }
    })();
  }, []);

  useEffect(() => {
    const id = initialListingId ?? qId;
    if (id) {
      setListingId(id);
      void load(id);
      void loadContracts(id);
    }
  }, [qId, initialListingId, load, loadContracts]);

  async function ensureDraft(): Promise<string | null> {
    if (listingId) return listingId;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/fsbo/listings/draft", { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not start draft");
        return null;
      }
      const id = typeof data.id === "string" ? data.id : null;
      if (!id) return null;
      setListingId(id);
      router.replace(`${createPath}?id=${encodeURIComponent(id)}`, { scroll: false });
      void loadContracts(id);
      return id;
    } finally {
      setLoading(false);
    }
  }

  async function patchHub(body: Record<string, unknown>) {
    const id = listingId ?? (await ensureDraft());
    if (!id) return false;
    const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/hub`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Save failed");
      return false;
    }
    setErr(null);
    return true;
  }

  async function saveStep1() {
    const price = Number.parseFloat(form.price.replace(/[^0-9.]/g, ""));
    const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;
    if (!form.title.trim() || priceCents < 1_000) {
      setErr("Title and a valid price (min $10) are required.");
      return false;
    }
    return patchHub({
      title: form.title,
      address: form.address,
      city: form.city,
      cadastreNumber: form.cadastreNumber,
      priceCents,
    });
  }

  async function saveStep2() {
    const annualTaxesCents = form.annualTaxes.trim()
      ? Math.round(Number.parseFloat(form.annualTaxes) * 100)
      : undefined;
    const condoFeesCents = form.condoFees.trim()
      ? Math.round(Number.parseFloat(form.condoFees) * 100)
      : undefined;
    return patchHub({
      description: form.description,
      propertyType: form.propertyType || null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms, 10) : null,
      surfaceSqft: form.surfaceSqft ? parseInt(form.surfaceSqft, 10) : null,
      yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
      ...(annualTaxesCents !== undefined && Number.isFinite(annualTaxesCents) ? { annualTaxesCents } : {}),
      ...(condoFeesCents !== undefined && Number.isFinite(condoFeesCents) ? { condoFeesCents } : {}),
    });
  }

  async function saveStep4(complete: boolean) {
    const id = listingId ?? (await ensureDraft());
    if (!id) return false;
    const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/hub`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerDeclarationJson: form.declaration,
        markDeclarationComplete: complete,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Declaration save failed");
      return false;
    }
    if (data.sellerDeclarationAiReview) {
      setDeclarationAiReview(parseSellerDeclarationAiReview(data.sellerDeclarationAiReview) ?? null);
    }
    if (data.listingAiScores) {
      setListingAiScores(parseListingAiScoresFromApi(data.listingAiScores));
    }
    const tg = data.trustGraph as { declarationReadiness?: { contradictionCount?: number; blockingIssuesCount?: number } } | undefined;
    if (tg?.declarationReadiness) {
      setTrustGraphEngineMetrics({
        contradictionCount: tg.declarationReadiness.contradictionCount ?? 0,
        blockingIssuesCount: tg.declarationReadiness.blockingIssuesCount ?? 0,
      });
    }
    setErr(null);
    return true;
  }

  async function uploadDoc(docType: string, file: File) {
    const id = listingId ?? (await ensureDraft());
    if (!id) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("docType", docType);
    const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/document-upload`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Document upload failed");
      return;
    }
    if (data.sellerDeclarationAiReview) {
      setDeclarationAiReview(parseSellerDeclarationAiReview(data.sellerDeclarationAiReview) ?? null);
    }
    if (data.listingAiScores) {
      setListingAiScores(parseListingAiScoresFromApi(data.listingAiScores));
    }
    setErr(null);
  }

  async function onNext() {
    setErr(null);
    if (step === 1) {
      const ok = await saveStep1();
      if (ok) setStep(2);
      return;
    }
    if (step === 2) {
      const ok = await saveStep2();
      if (ok) setStep(3);
      return;
    }
    if (step === 3) {
      setPhotoConfirmed(false);
      setPhotoVerificationStatus("PENDING");
      setStreetViewUrl(null);
      setPhotoMismatchDetected(false);
      setPhotoSimilarityScore(null);

      const id = listingId ?? (await ensureDraft());
      const exteriorUrl = Array.isArray(form.images) && typeof form.images?.[0] === "string" ? form.images[0] : null;

      await patchHub({ images: form.images, photoTagsJson: photoTypes });

      if (id && exteriorUrl && form.address.trim() && form.city.trim()) {
        try {
          const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/verify-photo-match`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exteriorPhotoUrl: exteriorUrl,
              address: form.address,
              city: form.city,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            if (typeof data.streetViewUrl === "string") setStreetViewUrl(data.streetViewUrl);
            if (typeof data.photoVerificationStatus === "string") {
              const next = data.photoVerificationStatus as "PENDING" | "VERIFIED" | "FLAGGED";
              setPhotoVerificationStatus(next);
            }
            if (typeof data.mismatchDetected === "boolean") setPhotoMismatchDetected(data.mismatchDetected);
            if (typeof data.similarityScore === "number") setPhotoSimilarityScore(data.similarityScore);
          }
        } catch {
          // If verification fails (API key missing, network, etc.), keep user in manual mode.
        }
      }

      setStep(4);
      return;
    }
    if (step === 4) {
      const ok = await saveStep4(true);
      if (ok) setStep(5);
      return;
    }
    if (step === 5) {
      setStep(6);
      if (listingId) void loadContracts(listingId);
      return;
    }
    if (step === 6) {
      setStep(7);
      return;
    }
  }

  async function onBack() {
    setErr(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function runAi(kind: "price" | "description" | "completeness") {
    const id = listingId ?? (await ensureDraft());
    if (!id) return;
    setAiBusy(kind);
    setAiHint(null);
    try {
      const res = await fetch("/api/seller/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiHint(typeof data.error === "string" ? data.error : "AI assist failed");
        return;
      }
      setAiHint(JSON.stringify(data, null, 2));
      if (kind === "description" && typeof data.suggestedDescription === "string") {
        setForm((f) => ({ ...f, description: data.suggestedDescription as string }));
      }
    } finally {
      setAiBusy(null);
    }
  }

  async function submitFinal() {
    const id = listingId ?? (await ensureDraft());
    if (!id) return;
    if (!legalAccepted) {
      setErr("Confirm the legal acknowledgments below before submitting.");
      return;
    }
    if (!photoConfirmed) {
      setErr("Confirm that uploaded photos represent the actual property before submitting.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const photoStatusOverride = photoVerificationStatus === "FLAGGED" ? "FLAGGED" : "VERIFIED";
      const legalOk = await patchHub({
        legalAccuracyAccepted: true,
        photoConfirmationAccepted: photoConfirmed,
        photoVerificationStatusOverride: photoStatusOverride,
      });
      if (!legalOk) {
        return;
      }
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/submit-for-verification`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.details) ? data.details.join(" · ") : data.error ?? "Submit failed";
        setErr(typeof msg === "string" ? msg : "Submit failed");
        return;
      }
      router.push(listingsHref);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={dashboardHref} className="text-sm text-premium-gold hover:underline">
          ← Seller dashboard
        </Link>
        <button
          type="button"
          onClick={() => void ensureDraft()}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Ensure draft saved
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>
      <p className="mt-1 text-sm text-slate-400">Step-by-step — declaration, documents, and contracts before submission.</p>
      <ListingTrustGraphPanel listingId={listingId} enabled={tg.listingBadge} />

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-premium-gold transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Step {step} of {STEPS.length}: {STEPS[step - 1]}
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-400">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Price (CAD)</span>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Street address</span>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">City</span>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Cadastre / lot</span>
              <input
                value={form.cadastreNumber}
                onChange={(e) => setForm((f) => ({ ...f, cadastreNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-400">Property type</span>
              <select
                value={form.propertyType}
                onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              >
                {PROPERTY_TYPES.map((p) => (
                  <option key={p || "any"} value={p}>
                    {p ? p.replace(/_/g, " ") : "Select…"}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-slate-400">Bedrooms</span>
                <input
                  value={form.bedrooms}
                  onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-400">Bathrooms</span>
                <input
                  value={form.bathrooms}
                  onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-slate-400">Living area (sq ft)</span>
              <input
                value={form.surfaceSqft}
                onChange={(e) => setForm((f) => ({ ...f, surfaceSqft: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-slate-400">Year built</span>
                <input
                  value={form.yearBuilt}
                  onChange={(e) => setForm((f) => ({ ...f, yearBuilt: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-400">Annual taxes ($)</span>
                <input
                  value={form.annualTaxes}
                  onChange={(e) => setForm((f) => ({ ...f, annualTaxes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-slate-400">Condo fees ($ / month)</span>
              <input
                value={form.condoFees}
                onChange={(e) => setForm((f) => ({ ...f, condoFees: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={6}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div>
            <ImageUploader
              listingId={listingId}
              images={form.images}
              onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
              photoTypes={photoTypes}
              onPhotoTypesChange={(types) => setPhotoTypes(types)}
              maxImages={photoLimit}
            />
            <p className="mt-3 text-xs text-slate-500">Save photos before continuing — Next syncs image URLs.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-amber-200/90">
              Seller declaration — required for submission. This is a platform disclosure checklist; it does not replace
              the official DS/DSD forms used with a licensed brokerage contract. Not legal advice.
            </p>
            {!isAdditionalDeclarationsSectionComplete(form.declaration) ? (
              <div
                role="status"
                className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
              >
                <p className="font-medium text-amber-50">Details &amp; Additional Declarations</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
                  Additional declarations are required to ensure full transparency. Open section 12, complete the text and
                  legal confirmation, and save at least one declaration entry before you can finish the checklist.
                </p>
              </div>
            ) : null}
            <SellerDeclarationForm
              listingId={listingId}
              declarationAiReview={declarationAiReview}
              listingAiScores={listingAiScores}
              showTrustGraphDeclarationWidget={tg.declarationWidget}
              trustGraphEngineMetrics={trustGraphEngineMetrics}
              value={form.declaration}
              onChange={(declaration) => setForm((f) => ({ ...f, declaration }))}
              annualTaxesCents={
                form.annualTaxes.trim()
                  ? Math.round(Number.parseFloat(form.annualTaxes.replace(/[^0-9.]/g, "")) * 100)
                  : null
              }
              priceCents={(() => {
                const n = Number.parseFloat(form.price.replace(/[^0-9.]/g, ""));
                return Number.isFinite(n) ? Math.round(n * 100) : 0;
              })()}
              propertyType={form.propertyType}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={declarationSaveBusy || loading}
                onClick={() => {
                  void (async () => {
                    setDeclarationSaveBusy(true);
                    setErr(null);
                    try {
                      await saveStep4(false);
                    } finally {
                      setDeclarationSaveBusy(false);
                    }
                  })();
                }}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
              >
                {declarationSaveBusy ? "Saving…" : "Save declaration progress"}
              </button>
              <p className="text-xs text-slate-500 self-center">
                Next validates and marks the declaration complete (all required sections).
              </p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Upload PDF or images. Required: proof of ownership and ID. Supporting documents below are also reviewed by the AI engine before approval.
            </p>
            {FSBO_HUB_REQUIRED_DOC_TYPES.map((dt) => (
              <div key={dt} className="rounded-lg border border-white/10 p-3">
                <p className="text-sm font-medium text-white capitalize">{dt.replace(/_/g, " ")} — required</p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="mt-2 text-xs text-slate-400"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadDoc(dt, f);
                  }}
                />
              </div>
            ))}
            <div className="rounded-lg border border-dashed border-white/20 p-3">
              <p className="text-sm text-slate-400">Optional</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-xs text-slate-500">Tax documents</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="mt-1 block text-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadDoc(FSBO_HUB_DOC_TYPES.TAX_OPTIONAL, f);
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500">Certificates</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="mt-1 block text-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadDoc(FSBO_HUB_DOC_TYPES.CERTIFICATE_OPTIONAL, f);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">AI evidence gate before publish approval</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Condo / divided co-ownership listings should upload condo documents.</li>
                <li>If renovation invoices are available, upload them.</li>
                <li>If new construction or warranty applies, upload builder or warranty documents.</li>
                <li>If the declaration mentions major issues or clarifications, upload supporting proof where available.</li>
              </ul>
            </div>
            {listingId ? (
              <SellerDocumentsPanel fsboListingId={listingId} canEdit />
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                Save the draft first to unlock the full supporting document library.
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Sign the seller agreement and platform terms. Use the same email as your account.
            </p>
            <ul className="space-y-2">
              {contracts.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
                >
                  <span className="text-sm text-white">{c.title || c.type}</span>
                  <span className="text-xs text-slate-500">{c.status}</span>
                  {c.status !== "signed" ? (
                    <button
                      type="button"
                      onClick={() => setModalId(c.id)}
                      className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      Review & sign
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400">Signed</span>
                  )}
                </li>
              ))}
            </ul>
            {contracts.length === 0 ? <p className="text-sm text-slate-500">Loading contracts…</p> : null}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3 text-sm text-slate-300">
            <p>Review your listing details, then submit for platform verification.</p>
            <ul className="list-inside list-disc space-y-1 text-slate-400">
              <li>Declaration completed</li>
              <li>Required documents uploaded</li>
              <li>Contracts signed</li>
            </ul>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm my seller declaration is complete and accurate, and the listing information is accurate to the best of my knowledge. I understand this is not legal advice.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
              <input
                type="checkbox"
                checked={photoConfirmed}
                onChange={(e) => setPhotoConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm that uploaded photos represent the actual property (Exterior first).
              </span>
            </label>
            {photoVerificationStatus === "FLAGGED" ? (
              <p className="text-xs text-red-300">
                Exterior photo may not match property address. Please verify.
              </p>
            ) : null}
            {streetViewUrl && form.images?.[0] ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-300">Exterior photo vs. Google Street View (preview)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.images[0]} alt="Exterior upload preview" className="aspect-video w-full object-cover" />
                    <p className="px-2 py-1 text-[10px] text-slate-400">Uploaded exterior</p>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={streetViewUrl} alt="Street view preview" className="aspect-video w-full object-cover" />
                    <p className="px-2 py-1 text-[10px] text-slate-400">Street view</p>
                  </div>
                </div>
                {photoMismatchDetected ? (
                  <p className="mt-2 text-xs text-red-300">Exterior photo may not match property address. Please verify.</p>
                ) : null}
              </div>
            ) : null}
            <p className="text-xs text-amber-200/80">
              Required before submit. A timestamp is stored when you submit.
            </p>
          </div>
        )}

        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => void onBack()}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200"
            >
              Back
            </button>
          ) : null}
          {step < 7 ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void onNext()}
              className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "…" : "Next"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void submitFinal()}
              className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit for verification"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-premium-gold/30 bg-[#1a1508]/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Use AI assistance</p>
        <p className="mt-1 text-xs text-slate-500">Heuristic hints only — not legal or appraisal advice.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!aiBusy}
            onClick={() => void runAi("price")}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200"
          >
            {aiBusy === "price" ? "…" : "Suggest price band"}
          </button>
          <button
            type="button"
            disabled={!!aiBusy}
            onClick={() => void runAi("description")}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200"
          >
            {aiBusy === "description" ? "…" : "Improve description"}
          </button>
          <button
            type="button"
            disabled={!!aiBusy}
            onClick={() => void runAi("completeness")}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200"
          >
            {aiBusy === "completeness" ? "…" : "Check completeness"}
          </button>
        </div>
        {aiHint ? (
          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-slate-400">{aiHint}</pre>
        ) : null}
      </div>

      <ContractModal
        open={modalId !== null}
        contractId={modalId}
        onClose={() => setModalId(null)}
        onSigned={() => {
          if (listingId) void loadContracts(listingId);
        }}
      />
    </div>
  );
}
