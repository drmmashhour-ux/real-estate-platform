"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bath,
  BedDouble,
  CheckCircle2,
  ExternalLink,
  Headphones,
  MapPin,
  Maximize2,
  Share2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { FsboListingGallery } from "@/components/fsbo/FsboListingGallery";
import { ListingFinancialSnapshot } from "@/components/listings/ListingFinancialSnapshot";
import { ListingMortgageCalculator } from "@/components/listings/ListingMortgageCalculator";
import { getTrackingSessionId, track } from "@/lib/tracking";
import { LegalAcknowledgmentModal } from "@/components/legal/LegalAcknowledgmentModal";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { LegalActionWarningModal } from "@/components/legal/LegalActionWarningModal";
import { CONTENT_LICENSE_ERROR } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";
import { trackImmoContactClient } from "@/lib/immo/track-client";
import { ImmoContactEventType } from "@prisma/client";
import { LEGAL_FORM_KEYS } from "@/modules/legal/legal-engine";
import { BuyerPropertyAiCards } from "@/components/ai/BuyerPropertyAiCards";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";
import { ContactLock } from "@/components/listing/contact-lock";
import { BuyerListingSimilar } from "@/components/listings/BuyerListingSimilar";
import { ShareListingActions } from "@/components/sharing/ShareListingActions";
import { ViralShareCallout } from "@/components/sharing/ViralShareCallout";
import { UrgencyBadge } from "@/components/listings/UrgencyBadge";
import type { ListingDemandUiPayload } from "@/lib/listings/listing-analytics-service";

export type BuyerListingPayload = {
  id: string;
  /** FSBO vs broker CRM listing (contact API resolves both). */
  listingKind?: "fsbo" | "crm";
  listingOwnerType?: "SELLER" | "BROKER" | null;
  listingCode?: string | null;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  address: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceSqft: number | null;
  images: string[];
  coverImage: string | null;
  contactEmail: string;
  contactPhone: string | null;
  propertyType: string | null;
  yearBuilt: number | null;
  annualTaxesCents: number | null;
  condoFeesCents: number | null;
  cadastreNumber: string | null;
  representative?: {
    name: string;
    roleLabel: string;
    email: string;
    phone: string | null;
    company: string | null;
    licenseNumber: string | null;
    licenseVerified: boolean;
    address: string | null;
  } | null;
  propertyDetails?: Array<{ label: string; value: string | null }>;
  transactionFlag?: {
    key: "offer_received" | "offer_accepted" | "sold";
    label: string;
    tone: "amber" | "emerald" | "slate";
  } | null;
};

export type ListingContactGateProps = {
  active: boolean;
  unlocked: boolean;
  targetKind: "FSBO_LISTING" | "CRM_LISTING";
};

type Modal = null | "contact" | "platform" | "immo" | "advisory" | "mortgage";

const TIMELINES = ["immediate", "1-3 months", "3+ months"] as const;

const DESCRIPTION_CLAMP_CHARS = 560;

function ListingDescriptionClamp({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const normalized = text.replace(/\s+/g, " ").trim();
  const long = normalized.length > DESCRIPTION_CLAMP_CHARS;
  const preview =
    long && !open ? `${normalized.slice(0, DESCRIPTION_CLAMP_CHARS).trim()}…` : normalized;
  return (
    <section
      className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
      aria-labelledby="about-heading"
    >
      <h2 id="about-heading" className="text-lg font-semibold tracking-tight text-white">
        About this property
      </h2>
      <div className="prose prose-invert mt-4 max-w-none">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-white/80">{preview}</p>
      </div>
      {long ? (
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#D4AF37] transition hover:text-[#E8D589]"
          onClick={() => setOpen(!open)}
        >
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </section>
  );
}

function mapListingSearchQuery(listing: BuyerListingPayload): string | null {
  const addr = listing.address?.trim() ?? "";
  const city = listing.city?.trim() ?? "";
  if (addr && !/^see listing representative$/i.test(addr)) {
    const full = `${addr}, ${city}`.replace(/,\s*$/, "");
    return full.trim() || null;
  }
  if (city && city.toLowerCase() !== "marketplace") {
    return city;
  }
  return null;
}

export function BuyerListingDetail({
  listing,
  listingContactGate,
  demandUi = null,
}: {
  listing: BuyerListingPayload;
  listingContactGate?: ListingContactGateProps;
  demandUi?: ListingDemandUiPayload | null;
}) {
  const [modal, setModal] = useState<Modal>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leadCheckoutBusy, setLeadCheckoutBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const [pbName, setPbName] = useState("");
  const [pbEmail, setPbEmail] = useState("");
  const [pbPhone, setPbPhone] = useState("");
  const [pbMin, setPbMin] = useState("");
  const [pbMax, setPbMax] = useState("");
  const [pbTimeline, setPbTimeline] = useState("");
  const [pbPrefs, setPbPrefs] = useState("");
  const [immoName, setImmoName] = useState("");
  const [immoEmail, setImmoEmail] = useState("");
  const [immoPhone, setImmoPhone] = useState("");
  const [immoMessage, setImmoMessage] = useState("");

  const [mgIncome, setMgIncome] = useState("");
  const [mgDown, setMgDown] = useState("");
  const [mgEmployment, setMgEmployment] = useState("");
  const [mgCredit, setMgCredit] = useState("");
  const [mgTimeline, setMgTimeline] = useState<(typeof TIMELINES)[number]>("1-3 months");

  const [legalKind, setLegalKind] = useState<null | "buyer" | "mortgage">(null);
  const afterLegal = useRef<(() => void) | null>(null);
  const [contentLicenseOpen, setContentLicenseOpen] = useState(false);
  const [contentLicenseVersion, setContentLicenseVersion] = useState<string>(CONTENT_LICENSE_VERSION);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [showViralShare, setShowViralShare] = useState(false);
  const afterContentLicense = useRef<(() => void) | null>(null);
  const [platformLegalWarnOpen, setPlatformLegalWarnOpen] = useState(false);
  const [platformLegalWarnMessage, setPlatformLegalWarnMessage] = useState("");
  const pendingPlatformLegalRef = useRef<(() => void) | null>(null);
  const skipPlatformLegalRef = useRef(false);

  useEffect(() => {
    const sid = getTrackingSessionId();
    void fetch("/api/buyer/listing-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fsboListingId: listing.id, sessionId: sid }),
    }).catch(() => {});
    track("listing_view", {
      meta: { fsboListingId: listing.id, path: typeof window !== "undefined" ? window.location.pathname : "" },
    });
    const kind = listing.listingKind === "crm" ? "crm" : "fsbo";
    trackImmoContactClient({
      listingId: listing.id,
      listingKind: kind,
      contactType: ImmoContactEventType.VIEW,
    });
  }, [listing.id, listing.listingKind]);

  useEffect(() => {
    void fetch("/api/buyer/saved-listings", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { savedIds?: string[] }) => {
        if (Array.isArray(j.savedIds)) {
          setSaved(j.savedIds.includes(listing.id));
        }
      })
      .catch(() => setSaved(false));
  }, [listing.id]);

  async function startListingContactCheckout() {
    const targetKind =
      listingContactGate?.targetKind ?? (listing.listingKind === "crm" ? "CRM_LISTING" : "FSBO_LISTING");
    setLeadCheckoutBusy(true);
    setFormError(null);
    try {
      const r = await fetch("/api/leads/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind,
          targetListingId: listing.id,
        }),
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Checkout failed");
      if (j.url) window.location.href = j.url;
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLeadCheckoutBusy(false);
    }
  }

  async function toggleSave() {
    setSubmitting(true);
    setFormError(null);
    try {
      const r = await fetch("/api/buyer/saved-listings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fsboListingId: listing.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setFormError("Sign in to save listings.");
        return;
      }
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not save");
      const nowSaved = Boolean(j.saved);
      setSaved(nowSaved);
      if (nowSaved) setShowViralShare(true);
      else setShowViralShare(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitContact() {
    if (!contactName.trim() || !contactEmail.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    if (contactMessage.trim().length < 5) {
      setFormError("Message must be at least 5 characters.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const r = await fetch("/api/buyer/contact-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          name: contactName,
          email: contactEmail,
          phone: contactPhone.trim() || undefined,
          message: contactMessage.trim(),
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        missing?: string[];
        requiredVersion?: string;
      };
      if (r.status === 402 && j.code === "LEAD_PAYMENT_REQUIRED") {
        await startListingContactCheckout();
        return;
      }
      if (r.status === 401 && j.code === "LEGAL_SIGN_IN_REQUIRED") {
        throw new Error(j.error ?? "Sign in to contact the listing broker and complete acknowledgments.");
      }
      if (r.status === 403 && j.error === CONTENT_LICENSE_ERROR && typeof j.requiredVersion === "string") {
        afterContentLicense.current = () => void submitContact();
        setContentLicenseVersion(j.requiredVersion);
        setContentLicenseOpen(true);
        return;
      }
      if (r.status === 403 && j.code === "LEGAL_FORMS_REQUIRED" && Array.isArray(j.missing)) {
        if (j.missing.includes(LEGAL_FORM_KEYS.BUYER_ACKNOWLEDGMENT)) {
          afterLegal.current = () => void submitContact();
          setLegalKind("buyer");
          return;
        }
      }
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Request failed");
      track("contact_listing_broker", { meta: { fsboListingId: listing.id } });
      setFeedback("Message sent. The listing representative will get back to you.");
      setShowViralShare(true);
      setModal(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPlatform() {
    if (!pbName.trim() || !pbEmail.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    if (!pbTimeline.trim()) {
      setFormError("Timeline is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFeedback(null);
    const minC = pbMin ? Math.round(parseFloat(pbMin) * 100) : null;
    const maxC = pbMax ? Math.round(parseFloat(pbMax) * 100) : null;
    try {
      if (!skipPlatformLegalRef.current) {
        const ev = await fetch("/api/legal/ai/evaluate-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            hub: "buyer",
            actionType: "platform_broker_request",
            entity: {
              description: `${pbTimeline}\n${pbPrefs}`.trim(),
              listingId: listing.id,
            },
          }),
        });
        const ej = (await ev.json()) as { requiresConfirmation?: boolean; message?: string };
        if (ev.ok && ej.requiresConfirmation && typeof ej.message === "string") {
          setPlatformLegalWarnMessage(ej.message);
          pendingPlatformLegalRef.current = () => {
            skipPlatformLegalRef.current = true;
            setPlatformLegalWarnOpen(false);
            void submitPlatform();
          };
          setPlatformLegalWarnOpen(true);
          return;
        }
      }
      skipPlatformLegalRef.current = false;

      const r = await fetch("/api/buyer/platform-broker-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fsboListingId: listing.id,
          buyerName: pbName,
          buyerEmail: pbEmail,
          buyerPhone: pbPhone.trim() || null,
          budgetMinCents: minC && Number.isFinite(minC) ? minC : null,
          budgetMaxCents: maxC && Number.isFinite(maxC) ? maxC : null,
          timeline: pbTimeline.trim(),
          preferences: pbPrefs.trim() || null,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        missing?: string[];
        conversationId?: string | null;
        requiredVersion?: string;
      };
      if (r.status === 401 && j.code === "LEGAL_SIGN_IN_REQUIRED") {
        throw new Error(j.error ?? "Sign in required for a platform broker request.");
      }
      if (r.status === 403 && j.error === CONTENT_LICENSE_ERROR && typeof j.requiredVersion === "string") {
        afterContentLicense.current = () => void submitPlatform();
        setContentLicenseVersion(j.requiredVersion);
        setContentLicenseOpen(true);
        return;
      }
      if (r.status === 403 && j.code === "LEGAL_FORMS_REQUIRED" && Array.isArray(j.missing)) {
        if (j.missing.includes(LEGAL_FORM_KEYS.BUYER_ACKNOWLEDGMENT)) {
          afterLegal.current = () => void submitPlatform();
          setLegalKind("buyer");
          return;
        }
      }
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Request failed");
      track("request_platform_broker", { meta: { fsboListingId: listing.id } });
      setFeedback(
        j.conversationId
          ? "You’re connected with a platform broker — check your messages."
          : "Request received. A broker will reach out by email shortly."
      );
      setModal(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitImmo() {
    if (!immoName.trim() || !immoEmail.trim() || !immoPhone.trim()) {
      setFormError("Name, email, and phone are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFeedback(null);
    try {
      const r = await fetch("/api/immo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingKind: listing.listingKind === "crm" ? "crm" : "bnhub",
          listingId: listing.id,
          listingRef: listing.id,
          source: "form",
          name: immoName,
          email: immoEmail,
          phone: immoPhone,
          message: immoMessage.trim() || "Buyer wants to open a monitored ImmoContact conversation.",
          sourcePage: typeof window !== "undefined" ? window.location.pathname : "/listings",
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Request failed");
      setFeedback("ImmoContact started. The platform keeps a traceable record of this contact flow.");
      setModal(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMortgage() {
    const income = parseFloat(mgIncome.replace(/[^0-9.]/g, ""));
    const down = parseFloat(mgDown.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(income) || income <= 0) {
      setFormError("Valid annual income is required.");
      return;
    }
    if (!Number.isFinite(down) || down < 0) {
      setFormError("Valid down payment is required.");
      return;
    }
    const price = listing.priceCents / 100;
    if (down > price) {
      setFormError("Down payment cannot exceed list price.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const r = await fetch("/api/mortgage/request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyPrice: price,
          downPayment: down,
          income,
          timeline: mgTimeline,
          preApproved: false,
          fsboListingId: listing.id,
          employmentStatus: mgEmployment.trim() || undefined,
          creditRange: mgCredit.trim() || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setFormError("Sign in to request mortgage support.");
        return;
      }
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Request failed");
      track("mortgage_request", { meta: { fsboListingId: listing.id } });
      setFeedback(typeof j.clientMessage === "string" ? j.clientMessage : "Mortgage request sent.");
      setModal(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAdvisory(plan: "one_time" | "subscription") {
    setSubmitting(true);
    setFormError(null);
    setFeedback(null);
    try {
      const r = await fetch("/api/buyer/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setFormError("Please sign in to purchase premium advisory.");
        return;
      }
      if (!r.ok) throw new Error(typeof j.message === "string" ? j.message : j.error ?? "Payment not available");
      track("advisory_purchase", { meta: { plan, fsboListingId: listing.id } });
      setFeedback("Premium advisory unlocked.");
      setModal(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const priceLabel = `$${(listing.priceCents / 100).toLocaleString("en-CA")}`;
  const isBrokerListing = listing.listingKind === "crm" || listing.listingOwnerType === "BROKER";
  const representativeLabel = isBrokerListing ? "Listing broker" : "Seller or representative";
  const sellHubModeLabel = isBrokerListing ? "Sell Hub broker path" : "Sell Hub free path";
  const representative = listing.representative ?? {
    name: isBrokerListing ? "Listing broker" : "Seller representative",
    roleLabel: representativeLabel,
    email: listing.contactEmail,
    phone: listing.contactPhone,
    company: isBrokerListing ? "Brokerage" : "Sell Hub Free",
    licenseNumber: null,
    licenseVerified: false,
    address: null,
  };
  const propertyDetails = [
    { label: "Bedrooms", value: listing.bedrooms != null ? String(listing.bedrooms) : null },
    { label: "Bathrooms", value: listing.bathrooms != null ? String(listing.bathrooms) : null },
    { label: "Surface", value: listing.surfaceSqft != null ? `${listing.surfaceSqft.toLocaleString()} sq ft` : null },
    { label: "Property type", value: listing.propertyType?.replace(/_/g, " ") ?? null },
    { label: "Year built", value: listing.yearBuilt != null ? String(listing.yearBuilt) : null },
    { label: "Cadastre / lot", value: listing.cadastreNumber },
    { label: "Annual taxes", value: listing.annualTaxesCents != null ? `$${(listing.annualTaxesCents / 100).toLocaleString("en-CA")}` : null },
    { label: "Condo fees", value: listing.condoFeesCents != null ? `$${(listing.condoFeesCents / 100).toLocaleString("en-CA")}/mo` : null },
    ...(listing.propertyDetails ?? []),
  ].filter((item) => item.value);

  const mapUrl = useMemo(() => {
    const q = mapListingSearchQuery(listing);
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }, [listing.address, listing.city]);

  const showVerifiedBadge = representative.licenseVerified || listing.listingKind === "crm";
  const primaryCtaLabel =
    listingContactGate?.active && !listingContactGate.unlocked
      ? "Unlock contact instantly"
      : isBrokerListing
        ? "Contact broker"
        : "Contact owner";
  const primaryCtaButtonClass =
    "relative z-10 rounded-full bg-[#D4AF37] font-semibold text-black shadow-[0_10px_35px_rgba(212,175,55,0.4)] ring-2 ring-[#D4AF37]/30 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100 min-h-[52px] text-base";
  const pricePerSqftLabel =
    listing.surfaceSqft != null && listing.surfaceSqft > 0
      ? `$${Math.round(listing.priceCents / 100 / listing.surfaceSqft).toLocaleString("en-CA")} / sq ft`
      : null;
  const paywallActive = Boolean(listingContactGate?.active && !listingContactGate.unlocked);
  const du = demandUi;
  const showDemandMessaging = Boolean(du?.hasSignal);
  const priceInsightHeadline = du?.pricingInsight.headline ?? "Fair market price";
  const pricingValueBulletTexts = useMemo(() => {
    const out: string[] = [priceInsightHeadline];
    if (du?.pricingInsight.detail) out.push(du.pricingInsight.detail);
    if (du?.priceMovementNote) out.push(du.priceMovementNote);
    if (pricePerSqftLabel) out.push(pricePerSqftLabel);
    return out;
  }, [priceInsightHeadline, du?.pricingInsight.detail, du?.priceMovementNote, pricePerSqftLabel]);
  const unifiedFrictionRiskLine = "No commitment • Takes 30 seconds • No hidden fees";

  function openPrimaryContact() {
    void fetch("/api/listings/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: listing.listingKind === "crm" ? "CRM" : "FSBO",
        listingId: listing.id,
        event: "contact_click",
      }),
    }).catch(() => {});
    trackImmoContactClient({
      listingId: listing.id,
      listingKind: listing.listingKind === "crm" ? "crm" : "fsbo",
      contactType: ImmoContactEventType.CONTACT_CLICK,
      metadata: { surface: "contact_listing_broker" },
    });
    if (listingContactGate?.active && !listingContactGate.unlocked) {
      void startListingContactCheckout();
      return;
    }
    setModal("contact");
    setFeedback(null);
    setFormError(null);
  }

  const featureRows = propertyDetails.map((item) => {
    const l = item.label.toLowerCase();
    let Icon = CheckCircle2;
    if (l.includes("bed")) Icon = BedDouble;
    else if (l.includes("bath")) Icon = Bath;
    else if (l.includes("surface") || l.includes("sq")) Icon = Maximize2;
    else if (l.includes("year")) Icon = Sparkles;
    return { ...item, Icon };
  });

  async function shareListing() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const kind = listing.listingKind === "crm" ? "CRM" : "FSBO";
    const postShare = () =>
      void fetch("/api/listings/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, listingId: listing.id, event: "share" }),
      }).catch(() => {});
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: listing.title, url });
        postShare();
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      postShare();
      setShareHint("Link copied to clipboard");
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      setShareHint("Copy the URL from your browser’s address bar");
      window.setTimeout(() => setShareHint(null), 4000);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] pb-[calc(6.75rem+env(safe-area-inset-bottom))] text-white lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/listings"
            className="text-sm font-semibold text-[#D4AF37] transition hover:text-[#E8D589]"
          >
            ← All listings
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/listings/${encodeURIComponent(listing.id)}/brochure`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-white/12 px-3 py-2 text-sm text-white/85 transition hover:border-[#D4AF37]/40 hover:bg-white/[0.04] sm:inline-flex"
            >
              Brochure
            </a>
            <button
              type="button"
              onClick={() => void toggleSave()}
              disabled={submitting || saved === null}
              className="rounded-full border border-white/12 bg-black/30 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-[#D4AF37]/35 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {saved === null ? "…" : saved ? "★ Saved" : "☆ Save"}
            </button>
            <Link
              href="/listings/saved"
              className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-[#D4AF37]/35 hover:text-white"
            >
              My saved
            </Link>
          </div>
        </div>

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10 xl:gap-12">
          <div className="min-w-0">
            <FsboListingGallery
              images={listing.images}
              coverImage={listing.coverImage}
              title={listing.title}
              verifiedListing={showVerifiedBadge}
            />

            <ul className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start" aria-label="Trust stack">
              {showVerifiedBadge ? (
                <li className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-black/45 px-3 py-1.5 text-xs font-semibold text-[#E8D589]">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" aria-hidden />
                  Verified listing
                </li>
              ) : (
                <li className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/80">
                  Active listing on LECIPM
                </li>
              )}
              {isBrokerListing ? (
                <li className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/80">
                  Broker-assisted
                </li>
              ) : null}
              <li className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75">
                Secure inquiry
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75">
                <Zap className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]/90" aria-hidden />
                Fast response
              </li>
              <li className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/75">
                No hidden fees
              </li>
            </ul>

            <div className="mt-6 h-px w-full max-w-xl bg-white/10 sm:max-w-none" aria-hidden />

            <header className="mt-8 border-b border-white/10 pb-8">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">{listing.title}</h1>
              {listing.transactionFlag ? (
                <div className="mt-4">
                  <ListingTransactionFlag flag={listing.transactionFlag} />
                </div>
              ) : null}
              {listing.listingCode ? (
                <p className="mt-3 font-mono text-xs tracking-wide text-white/45">ID {listing.listingCode}</p>
              ) : null}
              <p className="mt-4 text-3xl font-bold tracking-tight text-[#D4AF37] sm:text-4xl">{priceLabel}</p>
              <ul className="mt-2 space-y-1 text-sm text-white/78" aria-label="Pricing at a glance">
                {pricingValueBulletTexts.map((text, i) => (
                  <li key={`pv-${i}`} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                    <span className={i === 0 ? "font-medium text-white/85" : "text-white/75"}>{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-base text-white/70">{listing.address}</p>
              <p className="text-sm text-white/50">{listing.city}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {listing.bedrooms != null ? (
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90">
                    {listing.bedrooms} beds
                  </span>
                ) : null}
                {listing.bathrooms != null ? (
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90">
                    {listing.bathrooms} baths
                  </span>
                ) : null}
                {listing.surfaceSqft != null ? (
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90">
                    {listing.surfaceSqft.toLocaleString()} sqft
                  </span>
                ) : null}
                {listing.propertyType ? (
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/90">
                    {listing.propertyType.replace(/_/g, " ")}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#D4AF37]/35"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                    Map
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => void shareListing()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#D4AF37]/35"
                >
                  <Share2 className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                  Share
                </button>
              </div>
              <div className="mt-4">
                <ShareListingActions
                  shareTitle={listing.title}
                  variant="compact"
                  listingAnalytics={{
                    kind: listing.listingKind === "crm" ? "CRM" : "FSBO",
                    listingId: listing.id,
                  }}
                />
              </div>
              {shareHint ? (
                <p className="mt-2 text-xs text-emerald-400/90" role="status">
                  {shareHint}
                </p>
              ) : null}
            </header>

            <div className="mt-10 space-y-10">
              <section
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-black/50 to-[#0c0c0c] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8"
                aria-labelledby="availability-heading"
              >
                <h2
                  id="availability-heading"
                  className="text-sm font-semibold uppercase tracking-[0.14em] text-[#D4AF37]/90"
                >
                  Availability &amp; next steps
                </h2>
                <p className="mt-3 text-base leading-relaxed text-white/75">
                  Listing is active on LECIPM. Representatives typically reply within one business day. No obligation —
                  ask questions before you tour.
                </p>
              </section>

              <ListingFinancialSnapshot priceCents={listing.priceCents} />
              <ListingMortgageCalculator listPriceCents={listing.priceCents} />

              {featureRows.length > 0 ? (
                <section
                  className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
                  aria-labelledby="features-heading"
                >
                  <h2 id="features-heading" className="text-lg font-semibold tracking-tight text-white">
                    Details &amp; highlights
                  </h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {featureRows.map((item) => {
                      const RowIcon = item.Icon;
                      return (
                        <div
                          key={`${item.label}-${item.value}`}
                          className="flex gap-3 rounded-xl border border-white/[0.08] bg-black/35 px-4 py-3.5"
                        >
                          <RowIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-white/45">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold text-white/95">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <section
                className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
                aria-labelledby="financial-heading"
              >
                <h2 id="financial-heading" className="text-lg font-semibold tracking-tight text-white">
                  Financial summary
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/45">List price</p>
                    <p className="mt-2 text-lg font-bold text-white">{priceLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/45">Annual taxes</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {listing.annualTaxesCents != null
                        ? `$${(listing.annualTaxesCents / 100).toLocaleString("en-CA")}`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/45">Condo / fees</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {listing.condoFeesCents != null
                        ? `$${(listing.condoFeesCents / 100).toLocaleString("en-CA")}/mo`
                        : "—"}
                    </p>
                  </div>
                </div>
              </section>

              <ListingDescriptionClamp text={listing.description} />

              <section
                className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
                id="location"
                aria-labelledby="location-heading"
              >
                <h2 id="location-heading" className="text-lg font-semibold tracking-tight text-white">
                  Location
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {mapUrl
                    ? `Explore the area around ${listing.city}. Exact address details may be shared after you connect with the listing representative.`
                    : `${listing.city} — use search to explore the wider market on the map.`}
                </p>
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-2.5 text-sm font-semibold text-[#E8D589] transition hover:bg-[#D4AF37]/15"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    Open in Google Maps
                  </a>
                ) : null}
              </section>

              <section
                className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
                aria-labelledby="rep-heading"
              >
                <h2 id="rep-heading" className="text-lg font-semibold tracking-tight text-white">
                  Listing support
                </h2>
                <p className="mt-1 text-sm text-white/55">{sellHubModeLabel}</p>
                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-white/10 bg-black/35 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 sm:max-w-[52%]" aria-label="Trust and representative">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Trust stack</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                        <span>{showVerifiedBadge ? "Verified listing path on LECIPM" : "Active listing on LECIPM"}</span>
                      </li>
                      {isBrokerListing ? (
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                          <span>Broker-assisted — licensed representation</span>
                        </li>
                      ) : null}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                        <span>Secure inquiry — your message goes to the listing representative</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                        <span>Fast response</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                        <span>No hidden fees on this inquiry path</span>
                      </li>
                    </ul>
                    <div className="my-4 h-px bg-white/10" aria-hidden />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]/80">Value</p>
                    <ul className="mt-2 space-y-1 text-xs text-white/78" aria-label="Pricing at a glance">
                      {pricingValueBulletTexts.map((text, i) => (
                        <li key={`svc-${i}`} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]" aria-hidden />
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-lg font-semibold text-white">{representative.name}</p>
                    <p className="mt-1 text-sm text-white/70">{representative.roleLabel}</p>
                    {representative.company ? (
                      <p className="mt-1 text-sm text-white/50">{representative.company}</p>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      Ask questions, compare this home to others in {listing.city}, and plan a tour — all before any offer.
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm text-white/55">
                      <Headphones className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                      Usually responds within one business day
                    </p>
                    {representative.licenseNumber ? (
                      <p className="mt-2 text-xs text-white/45">
                        License {representative.licenseNumber}
                        {representative.licenseVerified ? " · verified" : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="w-full shrink-0 sm:w-auto sm:min-w-[220px]" aria-label="Call to action">
                    {listingContactGate?.active && !listingContactGate.unlocked ? (
                      <div className="mb-4">
                        <ContactLock
                          isPaid={false}
                          onUnlock={() => void startListingContactCheckout()}
                          busy={leadCheckoutBusy}
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={openPrimaryContact}
                      disabled={leadCheckoutBusy}
                      className={`w-full px-6 py-3 ${primaryCtaButtonClass}`}
                    >
                      {leadCheckoutBusy ? "Securing checkout…" : primaryCtaLabel}
                    </button>
                    {paywallActive ? (
                      <p className="mt-2 text-center text-[11px] text-[#E8D589]/90 sm:text-left">
                        Access phone &amp; email instantly after unlock
                      </p>
                    ) : null}
                    <div className="mt-4 space-y-2" aria-label="Urgency">
                      {showDemandMessaging && du?.badge && du.urgency ? (
                        <div className="flex flex-col gap-2">
                          <UrgencyBadge text={du.badge} level={du.urgency.level} />
                          <p className="text-xs text-white/70">{du.urgency.label}</p>
                        </div>
                      ) : null}
                    </div>
                    <p
                      className="mt-4 text-center text-[11px] text-white/60 sm:text-left"
                      aria-label="Friction and reassurance"
                    >
                      {unifiedFrictionRiskLine}
                    </p>
                    <p className="mt-2 text-center text-[10px] text-white/45 sm:text-left">
                      Representative typically replies within one business day
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start" aria-label="Soft actions">
                      <button
                        type="button"
                        onClick={() => void toggleSave()}
                        disabled={submitting || saved === null}
                        className="rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-[#D4AF37]/35 disabled:opacity-50"
                      >
                        {saved === null ? "…" : saved ? "★ Saved" : "☆ Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void shareListing()}
                        className="rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/75 transition hover:border-[#D4AF37]/35"
                      >
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModal("platform");
                          setFeedback(null);
                          setFormError(null);
                        }}
                        className="rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-white/55 transition hover:border-[#D4AF37]/25 hover:text-white/75"
                      >
                        Platform broker
                      </button>
                    </div>
                    <div className="mt-3">
                      <ShareListingActions
                        shareTitle={listing.title}
                        variant="compact"
                        listingAnalytics={{
                          kind: listing.listingKind === "crm" ? "CRM" : "FSBO",
                          listingId: listing.id,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-center text-[10px] text-white/45 sm:text-left">
                      Save to compare later · Share with someone searching
                    </p>
                  </div>
                </div>
                {!listingContactGate?.active || listingContactGate.unlocked ? (
                  <div className="mt-4 space-y-1 text-sm text-white/60">
                    {representative.phone ? <p>Phone: {representative.phone}</p> : null}
                    <p>Email: {representative.email}</p>
                  </div>
                ) : null}
              </section>

              <BuyerPropertyAiCards listing={listing} />

              <BuyerListingSimilar excludeId={listing.id} city={listing.city} />

              <section
                className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
                id="listing-more-help"
                aria-labelledby="more-help-heading"
              >
                <h2 id="more-help-heading" className="text-lg font-semibold text-white">
                  More ways we can help
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Optional — same secure standards. Platform, monitored contact, or financing.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setModal("platform");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-[#D4AF37]/35"
                  >
                    Platform broker
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModal("immo");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-[#D4AF37]/35"
                  >
                    ImmoContact
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModal("mortgage");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-[#D4AF37]/35"
                  >
                    Mortgage advice
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModal("advisory");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-[#D4AF37]/35"
                  >
                    Expert advisory
                  </button>
                </div>
              </section>
            </div>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-black/55 p-6 shadow-[0_28px_70px_-36px_rgba(0,0,0,0.95)] backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Trust stack</p>
              <ul className="mt-2 space-y-2 text-sm text-white/82" aria-label="Trust stack">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                  <span>{showVerifiedBadge ? "Verified listing" : "Active listing on LECIPM"}</span>
                </li>
                {isBrokerListing ? (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                    <span>Broker-assisted</span>
                  </li>
                ) : null}
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                  <span>Secure inquiry</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                  <span>No hidden fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                  <span>Fast response</span>
                </li>
              </ul>

              <div className="my-5 h-px bg-white/10" aria-hidden />

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]/90">Value</p>
              <p className="mt-2 text-3xl font-bold text-white">{priceLabel}</p>
              <ul className="mt-2 space-y-1 text-xs text-white/78" aria-label="Pricing at a glance">
                {pricingValueBulletTexts.map((text, i) => (
                  <li key={`as-${i}`} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]" aria-hidden />
                    <span className={i === 0 ? "font-medium text-white/85" : "text-white/75"}>{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-white/55">{listing.city}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                Compare in {listing.city}, ask questions, line up a tour before you decide.
              </p>

              {listingContactGate?.active && !listingContactGate.unlocked ? (
                <div className="mt-5">
                  <ContactLock
                    isPaid={false}
                    onUnlock={() => void startListingContactCheckout()}
                    busy={leadCheckoutBusy}
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={openPrimaryContact}
                disabled={leadCheckoutBusy}
                className={`mt-5 w-full px-4 py-3 ${primaryCtaButtonClass}`}
              >
                {leadCheckoutBusy ? "Securing checkout…" : primaryCtaLabel}
              </button>
              {paywallActive ? (
                <p className="mt-2 text-[11px] text-[#E8D589]/90">Access phone &amp; email instantly after unlock</p>
              ) : null}

              <div className="mt-4 space-y-2" aria-label="Urgency">
                {showDemandMessaging && du?.badge && du.urgency ? (
                  <>
                    <UrgencyBadge text={du.badge} level={du.urgency.level} />
                    <p className="text-xs text-white/70">{du.urgency.label}</p>
                  </>
                ) : null}
              </div>

              <p className="mt-4 text-xs text-white/60" aria-label="Friction and reassurance">
                {unifiedFrictionRiskLine}
              </p>
              <p className="mt-2 text-[10px] text-white/45">
                Representative typically replies within one business day
              </p>

              <div className="mt-4 border-t border-white/10 pt-4" aria-label="Soft actions">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">More actions</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleSave()}
                    disabled={submitting || saved === null}
                    className="flex-1 rounded-lg border border-white/10 bg-transparent py-2.5 text-xs font-medium text-white/55 transition hover:border-white/20 hover:text-white/75 disabled:opacity-50"
                  >
                    {saved === null ? "…" : saved ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareListing()}
                    className="flex-1 rounded-lg border border-white/10 bg-transparent py-2.5 text-xs font-medium text-white/55 transition hover:border-white/20 hover:text-white/75"
                  >
                    Share
                  </button>
                </div>
                <div className="mt-3">
                  <ShareListingActions
                    shareTitle={listing.title}
                    variant="compact"
                    listingAnalytics={{
                      kind: listing.listingKind === "crm" ? "CRM" : "FSBO",
                      listingId: listing.id,
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-white/45">
                  Save to compare later · Share with someone searching
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModal("platform");
                    setFeedback(null);
                    setFormError(null);
                  }}
                  className="mt-3 w-full rounded-xl border border-white/12 py-2.5 text-xs font-medium text-white/55 transition hover:border-[#D4AF37]/25 hover:bg-white/[0.04] hover:text-white/75"
                >
                  Prefer a platform broker?
                </button>
              </div>
            </div>
          </aside>
        </div>

        {feedback && !modal ? (
          <p className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </p>
        ) : null}
        <ViralShareCallout
          shareTitle={listing.title}
          visible={showViralShare && !modal}
          className="mt-4"
          listingAnalytics={{
            kind: listing.listingKind === "crm" ? "CRM" : "FSBO",
            listingId: listing.id,
          }}
        />
        {formError && !modal ? <p className="mt-4 text-sm text-red-400">{formError}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070707]/95 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-lg pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-lg">
          <div className="h-px w-full bg-white/10 opacity-80" aria-hidden />
          <div className="mt-2 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white">{priceLabel}</p>
              <p className="truncate text-xs text-white/50">{listing.city}</p>
            </div>
            <button
              type="button"
              onClick={openPrimaryContact}
              disabled={leadCheckoutBusy}
              className={`shrink-0 px-5 ${primaryCtaButtonClass}`}
            >
              {leadCheckoutBusy ? "…" : primaryCtaLabel}
            </button>
          </div>
          {paywallActive ? (
            <p className="mt-1.5 text-center text-[10px] text-[#E8D589]/90">
              Access phone &amp; email instantly after unlock
            </p>
          ) : null}
          {showDemandMessaging && du?.urgency ? (
            <div className="mt-2 flex flex-col items-center gap-1.5">
              {du.badge ? <UrgencyBadge text={du.badge} level={du.urgency.level} /> : null}
              <p className="text-center text-xs text-white/70">{du.urgency.label}</p>
            </div>
          ) : null}
          <p className="mt-2 text-center text-[11px] text-white/60">Instant access • No commitment • Secure</p>
        </div>
      </div>

      {modal === "contact" ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Contact listing representative"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{isBrokerListing ? "Contact broker" : "Contact owner"}</h3>
            <p className="mt-2 text-sm text-slate-400">Your message is sent to the {representativeLabel.toLowerCase()}.</p>
            <div className="mt-4 space-y-3">
              <input
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Name *"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <input
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Email *"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Phone (optional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <textarea
                required
                className="min-h-[100px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Message * (min. 5 characters)"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitContact()}
                className="flex-1 rounded-lg bg-premium-gold py-2.5 text-sm font-bold text-black disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send message"}
              </button>
            </div>
            {formError && modal === "contact" ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
          </div>
        </div>
      ) : null}

      {modal === "immo" ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-500/20 bg-[#121212] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">ImmoContact</h3>
            <p className="mt-2 text-sm text-slate-400">
              Monitored platform contact flow with traceable commission origin and compliance oversight.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Full name *"
                value={immoName}
                onChange={(e) => setImmoName(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Email *"
                type="email"
                value={immoEmail}
                onChange={(e) => setImmoEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Phone *"
                value={immoPhone}
                onChange={(e) => setImmoPhone(e.target.value)}
              />
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Message"
                value={immoMessage}
                onChange={(e) => setImmoMessage(e.target.value)}
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitImmo()}
                className="flex-1 rounded-lg bg-cyan-400 py-2.5 text-sm font-bold text-black disabled:opacity-50"
              >
                {submitting ? "Starting…" : "Start ImmoContact"}
              </button>
            </div>
            {formError && modal === "immo" ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
          </div>
        </div>
      ) : null}

      {modal === "platform" ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Platform broker</h3>
            <p className="mt-2 text-sm text-slate-400">We&apos;ll assign a licensed broker (round-robin).</p>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Full name *"
                value={pbName}
                onChange={(e) => setPbName(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Email *"
                type="email"
                value={pbEmail}
                onChange={(e) => setPbEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Phone"
                value={pbPhone}
                onChange={(e) => setPbPhone(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Budget min (CAD)"
                  value={pbMin}
                  onChange={(e) => setPbMin(e.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Budget max (CAD)"
                  value={pbMax}
                  onChange={(e) => setPbMax(e.target.value)}
                />
              </div>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Timeline * (e.g. 60 days)"
                value={pbTimeline}
                onChange={(e) => setPbTimeline(e.target.value)}
              />
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Preferences (optional)"
                value={pbPrefs}
                onChange={(e) => setPbPrefs(e.target.value)}
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitPlatform()}
                className="flex-1 rounded-lg bg-premium-gold py-2.5 text-sm font-bold text-black disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Get broker help"}
              </button>
            </div>
            {formError && modal === "platform" ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
          </div>
        </div>
      ) : null}

      {modal === "mortgage" ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-sky-500/20 bg-[#121212] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Mortgage advice</h3>
            <p className="mt-2 text-sm text-slate-400">
              We route you to a mortgage specialist. Sign in required. Not a lending commitment.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs text-slate-500">
                Annual gross income (CAD) *
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  inputMode="decimal"
                  value={mgIncome}
                  onChange={(e) => setMgIncome(e.target.value)}
                />
              </label>
              <label className="block text-xs text-slate-500">
                Down payment (CAD) *
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  inputMode="decimal"
                  value={mgDown}
                  onChange={(e) => setMgDown(e.target.value)}
                  placeholder={`e.g. ${Math.round(listing.priceCents / 100 / 10)}`}
                />
              </label>
              <label className="block text-xs text-slate-500">
                Employment
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={mgEmployment}
                  onChange={(e) => setMgEmployment(e.target.value)}
                  placeholder="e.g. salaried, self-employed"
                />
              </label>
              <label className="block text-xs text-slate-500">
                Credit range (optional)
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={mgCredit}
                  onChange={(e) => setMgCredit(e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="excellent">Excellent (720+)</option>
                  <option value="good">Good (680–719)</option>
                  <option value="fair">Fair (620–679)</option>
                  <option value="building">Building / unsure</option>
                </select>
              </label>
              <label className="block text-xs text-slate-500">
                Purchase timeline *
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={mgTimeline}
                  onChange={(e) => setMgTimeline(e.target.value as (typeof TIMELINES)[number])}
                >
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitMortgage()}
                className="flex-1 rounded-lg bg-sky-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Request mortgage help"}
              </button>
            </div>
            {formError && modal === "mortgage" ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
          </div>
        </div>
      ) : null}

      <LegalAcknowledgmentModal
        open={legalKind !== null}
        kind={legalKind === "mortgage" ? "mortgage" : "buyer"}
        onClose={() => {
          setLegalKind(null);
          afterLegal.current = null;
        }}
        onComplete={() => {
          const fn = afterLegal.current;
          afterLegal.current = null;
          setLegalKind(null);
          fn?.();
        }}
      />

      <ContentLicenseModal
        open={contentLicenseOpen}
        requiredVersion={contentLicenseVersion}
        onClose={() => {
          setContentLicenseOpen(false);
          afterContentLicense.current = null;
        }}
        onAccepted={() => {
          const fn = afterContentLicense.current;
          afterContentLicense.current = null;
          setContentLicenseOpen(false);
          fn?.();
        }}
      />

      <LegalActionWarningModal
        open={platformLegalWarnOpen}
        message={platformLegalWarnMessage}
        onCancel={() => {
          pendingPlatformLegalRef.current = null;
          setPlatformLegalWarnOpen(false);
        }}
        onConfirm={() => {
          const fn = pendingPlatformLegalRef.current;
          pendingPlatformLegalRef.current = null;
          fn?.();
        }}
      />

      {modal === "advisory" ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#121212] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Expert advisory</h3>
            <p className="mt-2 text-sm text-slate-400">
              One-time session or ongoing subscription — unlocks priority support and PREMIUM buyer tier.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex justify-between rounded-lg border border-white/10 px-3 py-2">
                <span>One-time advisory</span>
                <span className="font-semibold text-premium-gold">$99</span>
              </li>
              <li className="flex justify-between rounded-lg border border-white/10 px-3 py-2">
                <span>Monthly</span>
                <span className="font-semibold text-premium-gold">$49/mo</span>
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitAdvisory("one_time")}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Choose one-time ($99)
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitAdvisory("subscription")}
                className="w-full rounded-xl border border-violet-500/40 py-3 text-sm font-semibold text-violet-100 hover:bg-violet-950/50 disabled:opacity-50"
              >
                Choose subscription ($49/mo)
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="mt-2 text-center text-sm text-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>
            {formError && modal === "advisory" ? (
              <p className="mt-3 text-sm text-amber-200" role="status">
                {formError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
