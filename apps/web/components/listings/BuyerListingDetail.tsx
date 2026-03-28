"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, MapPin, Share2 } from "lucide-react";
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

export type BuyerListingPayload = {
  id: string;
  /** FSBO vs broker CRM listing (contact API resolves both). */
  listingKind?: "fsbo" | "crm";
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
};

type Modal = null | "contact" | "platform" | "advisory" | "mortgage";

const TIMELINES = ["immediate", "1-3 months", "3+ months"] as const;

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

export function BuyerListingDetail({ listing }: { listing: BuyerListingPayload }) {
  const [modal, setModal] = useState<Modal>(null);
  const [submitting, setSubmitting] = useState(false);
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
      setSaved(Boolean(j.saved));
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

  const mapUrl = useMemo(() => {
    const q = mapListingSearchQuery(listing);
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }, [listing.address, listing.city]);

  async function shareListing() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: listing.title, url });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareHint("Link copied to clipboard");
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      setShareHint("Copy the URL from your browser’s address bar");
      window.setTimeout(() => setShareHint(null), 4000);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] pb-28 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/listings" className="text-sm font-medium text-premium-gold hover:text-[#E8D5A0]">
            ← All listings
          </Link>
          <button
            type="button"
            onClick={() => void toggleSave()}
            disabled={submitting || saved === null}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-premium-text-muted hover:bg-white/5 disabled:opacity-50"
          >
            {saved === null ? "…" : saved ? "★ Saved" : "☆ Save listing"}
          </button>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <FsboListingGallery images={listing.images} coverImage={listing.coverImage} title={listing.title} />

            <section className="mt-8">
              <h1 className="text-3xl font-semibold tracking-tight">{listing.title}</h1>
              {listing.listingCode ? (
                <p className="mt-2 font-mono text-xs tracking-wide text-slate-500">Listing code · {listing.listingCode}</p>
              ) : null}
              <p className="mt-2 text-2xl font-bold text-premium-gold">{priceLabel}</p>
              <p className="mt-2 text-[#B3B3B3]">
                {listing.address}, {listing.city}
              </p>
              {listing.propertyType ? (
                <p className="mt-1 text-sm text-slate-500">Type · {listing.propertyType.replace(/_/g, " ")}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:border-premium-gold/40 hover:bg-white/[0.06]"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
                    View on map
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => void shareListing()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:border-premium-gold/40 hover:bg-white/[0.06]"
                >
                  <Share2 className="h-4 w-4 shrink-0 text-premium-gold" aria-hidden />
                  Share listing
                </button>
              </div>
              {shareHint ? (
                <p className="mt-2 text-xs text-emerald-400/90" role="status">
                  {shareHint}
                </p>
              ) : null}
            </section>

            <div className="mt-10 space-y-10">
              <ListingFinancialSnapshot priceCents={listing.priceCents} />
              <ListingMortgageCalculator listPriceCents={listing.priceCents} />

              <section aria-labelledby="prop-details-heading">
                <h2 id="prop-details-heading" className="text-lg font-semibold text-white">
                  Property details
                </h2>
                <ul className="mt-3 flex flex-wrap gap-4 text-sm text-[#B3B3B3]">
                  {listing.bedrooms != null ? <li>{listing.bedrooms} bed</li> : null}
                  {listing.bathrooms != null ? <li>{listing.bathrooms} bath</li> : null}
                  {listing.surfaceSqft != null ? <li>{listing.surfaceSqft.toLocaleString()} sq ft</li> : null}
                </ul>
              </section>

              <section aria-labelledby="building-heading">
                <h2 id="building-heading" className="text-lg font-semibold text-white">
                  Building details
                </h2>
                <ul className="mt-3 flex flex-wrap gap-4 text-sm text-[#B3B3B3]">
                  {listing.yearBuilt != null ? <li>Built {listing.yearBuilt}</li> : null}
                  {listing.annualTaxesCents != null ? (
                    <li>Annual taxes ~ ${(listing.annualTaxesCents / 100).toLocaleString("en-CA")}</li>
                  ) : null}
                  {listing.condoFeesCents != null ? (
                    <li>Condo fees ~ ${(listing.condoFeesCents / 100).toLocaleString("en-CA")}/mo</li>
                  ) : null}
                  {listing.cadastreNumber?.trim() ? <li>Lot {listing.cadastreNumber}</li> : null}
                </ul>
              </section>

              <section aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-lg font-semibold text-white">
                  About this property
                </h2>
                <div className="prose prose-invert mt-3 max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{listing.description}</p>
                </div>
              </section>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <BuyerPropertyAiCards listing={listing} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-premium-gold">Listing representative</h2>
              <p className="mt-2 text-sm text-[#B3B3B3]">
                FSBO listing — you&apos;re contacting the seller (or their representative) for this property.
              </p>
            </div>

            <div className="rounded-2xl border border-premium-gold/30 bg-[#0f0f0f] p-6 shadow-[0_0_32px_rgb(var(--premium-gold-channels) / 0.08)]">
              <h2 className="text-lg font-semibold text-white">Get help</h2>
              <p className="mt-2 text-sm text-[#B3B3B3]">Three ways to move forward — pick what fits.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Direct</p>
                  <button
                    type="button"
                    onClick={() => {
                      trackImmoContactClient({
                        listingId: listing.id,
                        listingKind: listing.listingKind === "crm" ? "crm" : "fsbo",
                        contactType: ImmoContactEventType.CONTACT_CLICK,
                        metadata: { surface: "contact_listing_broker" },
                      });
                      setModal("contact");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="mt-2 w-full rounded-xl bg-premium-gold px-4 py-3 text-sm font-bold text-black transition hover:brightness-110"
                  >
                    Contact listing broker
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Guided</p>
                  <button
                    type="button"
                    onClick={() => {
                      setModal("platform");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40"
                  >
                    Get help from platform broker
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/90">Financing</p>
                  <button
                    type="button"
                    onClick={() => {
                      setModal("mortgage");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="mt-2 w-full rounded-xl border border-sky-500/30 bg-sky-950/30 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-950/50"
                  >
                    Get mortgage advice
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">Premium</p>
                  <button
                    type="button"
                    onClick={() => {
                      setModal("advisory");
                      setFeedback(null);
                      setFormError(null);
                    }}
                    className="mt-2 w-full rounded-xl border border-violet-500/30 bg-violet-950/40 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-950/60"
                  >
                    Get expert advice ($99)
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {feedback && !modal ? (
          <p className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            {feedback}
          </p>
        ) : null}
        {formError && !modal ? <p className="mt-4 text-sm text-red-400">{formError}</p> : null}
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
            <h3 className="text-lg font-semibold text-white">Contact listing broker</h3>
            <p className="mt-2 text-sm text-slate-400">Your message is sent to the listing representative.</p>
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
                {submitting ? "Sending…" : "Send"}
              </button>
            </div>
            {formError && modal === "contact" ? <p className="mt-3 text-sm text-red-400">{formError}</p> : null}
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
                {submitting ? "Submitting…" : "Submit"}
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
                {submitting ? "Sending…" : "Submit"}
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
