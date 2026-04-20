"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploader } from "@/components/fsbo/ImageUploader";
import { PhotoListingExamplesGuide } from "@/components/fsbo/PhotoListingExamplesGuide";
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
  buildDemoListingBasics,
  buildDemoSellerDeclaration,
  isSellerDemoToolsEnabled,
  type DemoRepresentationMode,
} from "@/lib/fsbo/seller-declaration-demo-fill";
import {
  parseSellerDeclarationAiReview,
  type SellerDeclarationAiReview,
} from "@/lib/fsbo/seller-declaration-ai-review";
import type { ListingAiScoresResult } from "@/lib/fsbo/listing-ai-scores";
import { getFsboMaxPhotosForSellerPlan, type FsboPhotoType } from "@/lib/fsbo/photo-limits";
import { ListingTrustGraphPanel } from "@/components/trust/ListingTrustGraphPanel";
import { WritingCorrectionButton } from "@/components/ui/WritingCorrectionButton";
import { ListingDescriptionAiCopilot } from "@/components/seller/ListingDescriptionAiCopilot";
import { SellerAiAssistResult, type SellerAiAssistPanel } from "@/components/seller/SellerAiAssistResult";
import { useSuppressFooterHistoryNav } from "@/components/layout/FooterHistoryNavContext";

/** Prevents duplicate auto demo seeds (e.g. React Strict Mode double mount). */
const FSBO_AUTO_DEMO_SEED_IN_FLIGHT = new Set<string>();

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
  useSuppressFooterHistoryNav(true);
  const tg = trustGraph ?? { listingBadge: false, declarationWidget: false };
  const router = useRouter();
  const searchParams = useSearchParams();
  const qId = searchParams.get("id");
  const fromListingId = searchParams.get("from");
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
  const [draftSaveBusy, setDraftSaveBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [legalRiskAlert, setLegalRiskAlert] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiAssistPanel, setAiAssistPanel] = useState<SellerAiAssistPanel | null>(null);
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
  const [listingConsistencyWarnings, setListingConsistencyWarnings] = useState<string[]>([]);
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null);
  const [photoMismatchDetected, setPhotoMismatchDetected] = useState(false);
  const [photoSimilarityScore, setPhotoSimilarityScore] = useState<number | null>(null);
  const [listingCode, setListingCode] = useState<string | null>(null);
  const [publishOnCentris, setPublishOnCentris] = useState(false);
  const [centrisStatus, setCentrisStatus] = useState<string | null>(null);
  const [demoPhotoBusy, setDemoPhotoBusy] = useState<null | "seed" | "food">(null);
  const [photoDemoNotice, setPhotoDemoNotice] = useState<string | null>(null);
  const [prefilledFromPrevious, setPrefilledFromPrevious] = useState(false);

  const load = useCallback(async (id: string) => {
    const res = await fetch(`/api/fsbo/listings/${id}`, { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const l = data.listing;
    if (!l) return;
    setListingCode(typeof l.listingCode === "string" && l.listingCode.trim() ? l.listingCode.trim() : null);
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

  const templateHydratedRef = useRef(false);

  /** New listing prefilled from another FSBO listing (same pattern as BNHUB `?from=`). */
  useEffect(() => {
    const routeId = initialListingId ?? qId;
    if (routeId || !fromListingId?.trim() || templateHydratedRef.current) return;
    templateHydratedRef.current = true;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(fromListingId.trim())}`, {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled || !res.ok || !data.listing) return;
      const l = data.listing as Record<string, unknown>;
      const decl = emptySellerDeclaration();
      const addr = typeof l.address === "string" ? l.address : "";
      const cityRaw = typeof l.city === "string" ? l.city : "";
      decl.propertyAddressStructured = {
        street: addr.trim() && addr !== "TBD" ? addr.trim() : "",
        unit: "",
        city: cityRaw.trim() && cityRaw !== "TBD" ? cityRaw.trim() : "",
        postalCode: "",
      };
      const titleBase = typeof l.title === "string" ? l.title.trim() : "";
      setForm({
        title: titleBase ? `${titleBase} (copy)` : "",
        price: typeof l.priceCents === "number" ? String(l.priceCents / 100) : "",
        address: addr,
        city: cityRaw,
        cadastreNumber: typeof l.cadastreNumber === "string" ? l.cadastreNumber : "",
        description: typeof l.description === "string" ? l.description : "",
        propertyType: typeof l.propertyType === "string" ? l.propertyType : "",
        bedrooms: l.bedrooms != null ? String(l.bedrooms as number) : "",
        bathrooms: l.bathrooms != null ? String(l.bathrooms as number) : "",
        surfaceSqft: l.surfaceSqft != null ? String(l.surfaceSqft as number) : "",
        yearBuilt: l.yearBuilt != null ? String(l.yearBuilt as number) : "",
        annualTaxes: l.annualTaxesCents != null ? String((l.annualTaxesCents as number) / 100) : "",
        condoFees: l.condoFeesCents != null ? String((l.condoFeesCents as number) / 100) : "",
        images: Array.isArray(l.images) ? [...(l.images as string[])] : [],
        declaration: decl,
      });
      const images = Array.isArray(l.images) ? (l.images as string[]) : [];
      const rawTags = l.photoTagsJson;
      const derived = Array.isArray(rawTags)
        ? rawTags.filter((t: unknown): t is string => typeof t === "string")
        : [];
      const normalized: FsboPhotoType[] =
        images.length > 0
          ? Array.from({ length: images.length }).map((_, i) => {
              const t = derived[i];
              const upper = typeof t === "string" ? t.toUpperCase() : "";
              const v =
                upper === "EXTERIOR" || upper === "INTERIOR" || upper === "STREET_VIEW" || upper === "OTHER"
                  ? upper
                  : "";
              return (v as FsboPhotoType) || (i === 0 ? "EXTERIOR" : "OTHER");
            })
          : [];
      if (normalized.length > 0) normalized[0] = "EXTERIOR";
      setPhotoTypes(normalized);
      setPrefilledFromPrevious(true);
      router.replace(createPath, { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [fromListingId, initialListingId, qId, createPath, router]);

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
      if (typeof data.legalRiskAlert === "string" && data.legalRiskAlert.trim()) {
        setLegalRiskAlert(data.legalRiskAlert.trim());
      } else {
        setLegalRiskAlert(null);
      }
      const id = typeof data.id === "string" ? data.id : null;
      if (!id) return null;
      setListingId(id);
      if (typeof data.listingCode === "string" && data.listingCode.trim()) {
        setListingCode(data.listingCode.trim());
      }
      router.replace(`${createPath}?id=${encodeURIComponent(id)}`, { scroll: false });
      void loadContracts(id);
      void load(id);
      return id;
    } finally {
      setLoading(false);
    }
  }

  const ensureDraftRef = useRef(ensureDraft);
  ensureDraftRef.current = ensureDraft;

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
    if (Array.isArray(data.listingConsistencyWarnings) && data.listingConsistencyWarnings.length > 0) {
      setListingConsistencyWarnings(
        data.listingConsistencyWarnings.filter((x: unknown): x is string => typeof x === "string")
      );
    } else {
      setListingConsistencyWarnings([]);
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

  async function saveDeclarationProgress() {
    setErr(null);
    setDraftSaveBusy(true);
    try {
      await saveStep4(false);
    } finally {
      setDraftSaveBusy(false);
    }
  }

  async function saveCurrentDraft() {
    if (step === 4) {
      await saveDeclarationProgress();
      return;
    }
    setErr(null);
    setDraftSaveBusy(true);
    try {
      if (step === 1) {
        await saveStep1();
        return;
      }
      if (step === 2) {
        await saveStep2();
        return;
      }
      if (step === 3) {
        await patchHub({ images: form.images, photoTagsJson: photoTypes });
      }
    } finally {
      setDraftSaveBusy(false);
    }
  }

  async function runAi(kind: "price" | "description" | "completeness") {
    const id = listingId ?? (await ensureDraft());
    if (!id) return;
    setAiBusy(kind);
    setAiAssistPanel(null);
    try {
      const res = await fetch("/api/seller/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiAssistPanel({
          variant: "error",
          message: typeof data.error === "string" ? data.error : "We couldn’t retrieve that insight. Please try again.",
        });
        return;
      }
      if (kind === "description" && typeof data.suggestedDescription === "string") {
        setForm((f) => ({ ...f, description: data.suggestedDescription as string }));
        setAiAssistPanel({
          variant: "description",
          data: {
            summary:
              typeof data.summary === "string"
                ? data.summary
                : "Your description has been updated from your saved listing.",
            updated: true,
          },
        });
        return;
      }
      setAiAssistPanel({ variant: kind, data: data as Record<string, unknown> });
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
      const submittedCode =
        typeof data.listingCode === "string" && data.listingCode.trim()
          ? data.listingCode.trim()
          : listingCode;
      const q =
        submittedCode != null
          ? `?submitted=1&code=${encodeURIComponent(submittedCode)}`
          : "?submitted=1";
      router.push(`${listingsHref}${q}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const demoTools = isSellerDemoToolsEnabled();

  function applyDemoDeclaration(mode: DemoRepresentationMode) {
    setErr(null);
    setForm((f) => {
      const pt = f.propertyType || "SINGLE_FAMILY";
      const decl = buildDemoSellerDeclaration(pt, {
        representation: mode,
        address: {
          street: f.address.trim() || undefined,
          city: f.city.trim() || undefined,
        },
      });
      return { ...f, declaration: decl };
    });
  }

  function applyDemoListingBasics(kind: "house" | "condo") {
    setErr(null);
    const b = buildDemoListingBasics(kind);
    setForm((f) => ({
      ...f,
      title: b.title,
      price: b.price,
      address: b.address,
      city: b.city,
      cadastreNumber: b.cadastreNumber,
      description: b.description,
      propertyType: b.propertyType,
      bedrooms: b.bedrooms,
      bathrooms: b.bathrooms,
      surfaceSqft: b.surfaceSqft,
      yearBuilt: b.yearBuilt,
      annualTaxes: b.annualTaxes,
      condoFees: b.condoFees,
    }));
  }

  async function seedDemoPropertyPhotos() {
    setPhotoDemoNotice(null);
    const id = listingId ?? (await ensureDraft());
    if (!id) return;
    setDemoPhotoBusy("seed");
    setErr(null);
    try {
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/seed-demo-photos`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "property" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not add example photos");
        return;
      }
      setListingId(id);
      void load(id);
      const n = typeof data.added === "number" ? data.added : 0;
      setPhotoDemoNotice(
        n > 0
          ? `Added ${n} example listing photo(s). Replace them with your own shots before publishing.`
          : "Example photos were requested."
      );
    } finally {
      setDemoPhotoBusy(null);
    }
  }

  async function runDemoFoodPhotoCheck() {
    setPhotoDemoNotice(null);
    const id = listingId ?? (await ensureDraft());
    if (!id) return;
    setDemoPhotoBusy("food");
    setErr(null);
    try {
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/seed-demo-photos`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "food_test" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Food photo check failed");
        return;
      }
      setListingId(id);
      const msg = typeof data.userMessage === "string" ? data.userMessage : "Check completed.";
      const rejected = data.rejected === true;
      setPhotoDemoNotice(
        rejected ? `Rejected — ${msg}` : `Accepted by current rules — ${msg}`
      );
    } finally {
      setDemoPhotoBusy(null);
    }
  }

  /** Demo / dev: when Photos step opens with an empty gallery, load bundled sample images once (session). */
  useEffect(() => {
    if (!demoTools || step !== 3) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const id = listingId ?? (await ensureDraftRef.current());
          if (!id) return;

          if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(`fsbo-demo-seeded-${id}`)) {
            return;
          }
          if (FSBO_AUTO_DEMO_SEED_IN_FLIGHT.has(id)) return;

          const listRes = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}`, {
            credentials: "same-origin",
          });
          const listData = await listRes.json().catch(() => ({}));
          const imgs = Array.isArray(listData?.listing?.images) ? listData.listing.images : [];
          if (imgs.length > 0) return;

          FSBO_AUTO_DEMO_SEED_IN_FLIGHT.add(id);
          setDemoPhotoBusy("seed");
          setErr(null);
          try {
            const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(id)}/seed-demo-photos`, {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "property" }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setErr(
                typeof data.error === "string"
                  ? data.error
                  : "Demo photos could not load automatically (e.g. accept the content license first)."
              );
              return;
            }
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(`fsbo-demo-seeded-${id}`, "1");
            }
            setListingId(id);
            void load(id);
            const n = typeof data.added === "number" ? data.added : 0;
            setPhotoDemoNotice(
              n > 0
                ? `Demo: loaded ${n} sample photo(s) automatically. Replace with your own before publishing.`
                : "Demo photos loaded."
            );
          } finally {
            FSBO_AUTO_DEMO_SEED_IN_FLIGHT.delete(id);
            setDemoPhotoBusy(null);
          }
        } catch {
          // ignore auto demo failures
        }
      })();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [step, listingId, demoTools, load]);

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
      <p className="mt-1 text-sm text-slate-400">
        {prefilledFromPrevious
          ? "Prefilled from a previous listing — review each step. Seller Declaration starts fresh for this property. Use Save / Continue as you go."
          : "Basics → details → photos → declaration & documents → submit. Save a draft anytime; finish compliance before you publish."}
      </p>
      {prefilledFromPrevious ? (
        <div
          className="mt-4 rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95"
          role="status"
        >
          <p className="font-medium text-emerald-50">Faster second listing</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-100/85">
            Same full workflow as your first listing — we copied property details and photos as a starting point. Update
            anything that differs, then save your draft and continue.
          </p>
        </div>
      ) : null}
      {listingId && listingCode ? (
        <div className="mt-4 rounded-xl border border-premium-gold/35 bg-premium-gold/5 px-4 py-3 text-sm">
          <p className="font-medium text-premium-gold">Listing code (save this)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg tracking-wide text-white">{listingCode}</span>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
              onClick={() => {
                void navigator.clipboard.writeText(listingCode).catch(() => null);
              }}
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Use this code with support or in emails. Signed in, you can always continue from{" "}
            <Link href={listingsHref} className="text-premium-gold hover:underline">
              My listings
            </Link>{" "}
            — no code required. Forgot? Use &quot;Email my listing codes&quot; on that page.
          </p>
        </div>
      ) : null}
      {demoTools ? (
        <div
          role="region"
          aria-label="QA demo fills"
          className="mt-4 rounded-xl border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-xs text-amber-100/95"
        >
          <p className="font-semibold text-amber-50">QA / demo fills (dev or NEXT_PUBLIC_SELLER_DEMO_TOOLS=1)</p>
          <p className="mt-1 leading-relaxed text-amber-100/85">
            Prefill listing fields and the full seller declaration (FSBO vs with-broker notes) to test validation, buyer
            interest, and submission flows. Replace the placeholder ID URL with a real upload before production.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyDemoListingBasics("house")}
              className="rounded-lg border border-amber-400/40 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-amber-50 hover:bg-amber-500/15"
            >
              Fill steps 1–2: demo house
            </button>
            <button
              type="button"
              onClick={() => applyDemoListingBasics("condo")}
              className="rounded-lg border border-amber-400/40 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-amber-50 hover:bg-amber-500/15"
            >
              Fill steps 1–2: demo condo
            </button>
          </div>
        </div>
      ) : null}
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
            <label className="block text-sm text-slate-300">
              <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
                <span className="text-slate-400">Description</span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ListingDescriptionAiCopilot
                    form={form}
                    currentDescription={form.description}
                    onApply={(v) => setForm((f) => ({ ...f, description: v }))}
                  />
                  <WritingCorrectionButton
                    text={form.description}
                    onApply={(v) => setForm((f) => ({ ...f, description: v }))}
                  />
                </div>
              </div>
              <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                <span className="font-medium text-slate-400">AI copilot:</span> &quot;Generate&quot; drafts from your
                title, address, type, and stats (step 1–2). Type notes or bullets first if you want specific points
                included. &quot;Correct writing&quot; fixes spelling and grammar only. Review everything before
                publishing.
              </p>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={8}
                placeholder="Optional: jot keywords or rough points, then use Generate description — or write freely and use Correct writing."
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder:text-slate-600"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <PhotoListingExamplesGuide />
            {form.propertyType === "CONDO" ? (
              <p className="mb-3 rounded-lg border border-sky-500/30 bg-sky-950/25 px-3 py-2.5 text-xs leading-relaxed text-sky-100/95">
                <span className="font-semibold text-sky-50">Condo listing:</span> upload photos of your unit, balcony,
                the condominium building, lobby, corridors, or amenities. Images that look like a detached suburban house
                or a mobile home as the main subject may be rejected.
              </p>
            ) : form.propertyType === "SINGLE_FAMILY" || form.propertyType === "TOWNHOUSE" ? (
              <p className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-white/90">House / townhouse:</span> show this property — exterior,
                yard, and interior rooms. Photos that look like only a high-rise apartment unrelated to a house may be
                rejected.
              </p>
            ) : form.propertyType === "LAND" ? (
              <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2.5 text-xs text-amber-100/95">
                <span className="font-semibold text-amber-50">Land / lot:</span> prefer terrain, frontage, and lot
                context. Unrelated interior room photos may be rejected.
              </p>
            ) : null}
            {demoTools ? (
              <div
                role="region"
                aria-label="Demo listing photos"
                className="rounded-xl border border-amber-500/30 bg-amber-950/15 px-3 py-2.5 text-xs text-amber-100/90"
              >
                <p className="font-medium text-amber-50">Simulation — example uploads</p>
                <p className="mt-1 leading-relaxed text-amber-100/80">
                  On <span className="font-medium text-amber-50">Photos (step 3)</span>, five bundled JPEGs load{" "}
                  <span className="font-medium text-amber-50">automatically once per browser session</span> if the gallery
                  is empty (same upload path as real files). You can also use the button below, or run the food-image check.
                  Content license required to store photos.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!demoPhotoBusy}
                    onClick={() => void seedDemoPropertyPhotos()}
                    className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {demoPhotoBusy === "seed" ? "Adding…" : "Load demo photos (bundled)"}
                  </button>
                  <button
                    type="button"
                    disabled={!!demoPhotoBusy}
                    onClick={() => void runDemoFoodPhotoCheck()}
                    className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {demoPhotoBusy === "food" ? "Checking…" : "Test food photo (reject?)"}
                  </button>
                </div>
                {photoDemoNotice ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-50/95">{photoDemoNotice}</p>
                ) : null}
              </div>
            ) : null}
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
            {listingConsistencyWarnings.length > 0 ? (
              <div
                role="status"
                className="rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95"
              >
                <p className="font-medium text-amber-50">Listing vs declaration</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-amber-100/90">
                  {listingConsistencyWarnings.map((w, i) => (
                    <li key={`lcw-${i}`}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-sm text-amber-200/90">
              Seller declaration — required for submission. This is a platform disclosure checklist; it does not replace
              the official DS/DSD forms used with a licensed brokerage contract. Not legal advice.
            </p>
            {demoTools ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-amber-500/30 bg-amber-950/15 px-3 py-2">
                <button
                  type="button"
                  onClick={() => applyDemoDeclaration("fsbo")}
                  className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10"
                >
                  Fill all sections — FSBO (no broker notes)
                </button>
                <button
                  type="button"
                  onClick={() => applyDemoDeclaration("broker")}
                  className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/10"
                >
                  Fill all sections — with broker (DS path note)
                </button>
              </div>
            ) : null}
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
              onSectionSave={saveDeclarationProgress}
              sectionSaveBusy={draftSaveBusy}
            />
            <p className="text-xs text-slate-500">
              Use <span className="text-slate-400">Continue</span> below to finish the checklist when all sections are
              complete — that validates and marks the declaration complete.
            </p>
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
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={publishOnCentris}
                  onChange={(e) => void saveCentrisToggle(e.target.checked)}
                  disabled={draftSaveBusy}
                  className="mt-1 disabled:opacity-50"
                />
                <span className="text-slate-200">
                  Publish on Centris{" "}
                  <span className="text-slate-500">
                    (authorized syndication workflow only — LECIPM never scrapes Centris)
                  </span>
                </span>
              </label>
              {publishOnCentris ? (
                <p className="mt-2 text-xs text-slate-400">
                  Status:{" "}
                  {centrisStatus === "SYNCED"
                    ? "Synced ✅"
                    : centrisStatus === "PENDING"
                      ? "Pending ⏳"
                      : centrisStatus === "ERROR"
                        ? "Error ❌"
                        : "—"}
                </p>
              ) : null}
            </div>
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
        {legalRiskAlert ? (
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {legalRiskAlert}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
          {step > 1 ? (
            <button
              type="button"
              disabled={draftSaveBusy}
              onClick={() => void onBack()}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading || draftSaveBusy}
            onClick={() => void saveCurrentDraft()}
            className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/15 disabled:opacity-50"
          >
            {draftSaveBusy ? "Saving…" : "Save"}
          </button>
          {step < 7 ? (
            <button
              type="button"
              disabled={loading || draftSaveBusy}
              onClick={() => void onNext()}
              className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "…" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || draftSaveBusy}
              onClick={() => void submitFinal()}
              className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit for verification"}
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Save keeps this step without advancing. Continue moves to the next wizard step (declaration step validates completion).
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-premium-gold/25 bg-gradient-to-b from-[#1e1a12]/90 to-[#14110c]/95 p-5 shadow-[inset_0_1px_0_0_rgba(212,175,55,0.06)]">
        <p className="font-serif text-lg font-medium tracking-tight text-premium-gold/95">Listing insights</p>
        <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-slate-400">
          Guidance for your consideration—this is not legal, tax, or appraisal advice.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!aiBusy}
            onClick={() => void runAi("price")}
            className="rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-premium-gold/35 hover:bg-premium-gold/5 hover:text-white disabled:opacity-40"
          >
            {aiBusy === "price" ? "…" : "Price positioning"}
          </button>
          <button
            type="button"
            disabled={!!aiBusy}
            onClick={() => void runAi("description")}
            className="rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-premium-gold/35 hover:bg-premium-gold/5 hover:text-white disabled:opacity-40"
          >
            {aiBusy === "description" ? "…" : "Refresh description"}
          </button>
          <button
            type="button"
            disabled={!!aiBusy}
            onClick={() => void runAi("completeness")}
            className="rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-premium-gold/35 hover:bg-premium-gold/5 hover:text-white disabled:opacity-40"
          >
            {aiBusy === "completeness" ? "…" : "Readiness check"}
          </button>
        </div>
        {aiAssistPanel ? <SellerAiAssistResult panel={aiAssistPanel} /> : null}
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
