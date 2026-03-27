"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { DemoEvents } from "@/lib/demo-event-types";
import { ClientCommunicationChat } from "@/components/ai/ClientCommunicationChat";
import { ImmoContactTrustRow } from "@/components/immo/ImmoContactTrustRow";
import { ListingUserProvidedDisclaimer } from "@/components/legal/ListingUserProvidedDisclaimer";
import { AIDealAnalyzerCard } from "@/components/listings/AIDealAnalyzerCard";
import { MortgageSimulator } from "@/components/listings/MortgageSimulator";
import { AppointmentBookingCard } from "@/components/scheduling/AppointmentBookingCard";

const GOLD = "#C9A96E";
const DARK = "#0f0f0f";

export function ListingDesignStudioPage({ id }: { id: string }) {
  const [listing, setListing] = useState<{
    title: string;
    image?: string;
    price?: string;
    illustrativePriceUsd?: number | null;
  } | null>(null);
  const viewTracked = useRef(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [scheduleBrokerId, setScheduleBrokerId] = useState<string | null>(null);
  const [cta, setCta] = useState<"contact_broker" | "book_visit" | "more_info">("contact_broker");

  useEffect(() => {
    if (!id) return;
    viewTracked.current = false;
    fetch(`/api/design-studio/payload?id=${encodeURIComponent(id)}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        const title = typeof d?.title === "string" ? d.title : `Property ${id}`;
        const price = typeof d?.priceLabel === "string" ? d.priceLabel : undefined;
        const illustrativePriceUsd =
          typeof d?.illustrativePriceUsd === "number" && Number.isFinite(d.illustrativePriceUsd)
            ? d.illustrativePriceUsd
            : null;
        setListing({
          title,
          price,
          illustrativePriceUsd,
          image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
        });
        if (process.env.NEXT_PUBLIC_ENV === "staging" && !viewTracked.current) {
          viewTracked.current = true;
          void fetch("/api/demo/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              event: DemoEvents.VIEW_LISTING,
              metadata: { listingId: id, title, price },
            }),
          }).catch(() => {});
        }
      })
      .catch(() => setListing({ title: `Property ${id}`, image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994" }));
  }, [id]);

  const chatContext = useMemo(
    () => ({
      listingId: id,
      listingTitle: listing?.title ?? null,
      city: null as string | null,
      introducedByBrokerId: null as string | null,
    }),
    [id, listing?.title]
  );

  if (!id) {
    return (
      <div style={{ background: DARK, color: "white", minHeight: "100vh", padding: 20 }}>
        <p>Invalid listing.</p>
        <Link href="/" style={{ color: GOLD }}>
          ← Home
        </Link>
      </div>
    );
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 24,
    border: "1px solid rgba(201, 169, 110, 0.2)",
  };
  const buttonStyle = {
    padding: "14px 20px",
    background: GOLD,
    color: DARK,
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    maxWidth: 400,
    fontSize: 16,
    marginBottom: 10,
  };

  const title = listing?.title ?? "Property Listing";

  return (
    <main style={{ background: DARK, color: "white", minHeight: "100vh", padding: 20, paddingBottom: 120 }}>
      {chatOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: 12,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Contact assistant"
          onClick={(e) => {
            if (e.target === e.currentTarget) setChatOpen(false);
          }}
        >
          <div style={{ width: "100%", maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <ClientCommunicationChat
              key={`${id}-${cta}-chat`}
              context={chatContext}
              accent={GOLD}
              embedded
              autoBootstrap
              flow="immo_high_conversion"
              variant="immo"
            />
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              style={{
                ...buttonStyle,
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                marginTop: 8,
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {visitOpen && scheduleBrokerId ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 12,
            overflow: "auto",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Schedule a visit"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVisitOpen(false);
          }}
        >
          <div style={{ width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <AppointmentBookingCard
              brokerId={scheduleBrokerId}
              listingId={id}
              defaultType="PROPERTY_VISIT"
              titleHint={title ? `Visit · ${title}` : "Property visit"}
            />
            <button
              type="button"
              onClick={() => setVisitOpen(false)}
              style={{
                ...buttonStyle,
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                marginTop: 12,
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/listings" style={{ color: GOLD, display: "inline-block", marginBottom: 24 }}>
          ← Listings
        </Link>
        {listing?.image && (
          <img
            src={listing.image}
            alt=""
            style={{ width: "100%", borderRadius: 12, marginBottom: 16, objectFit: "cover", maxHeight: 320 }}
          />
        )}
        <h1 style={{ color: GOLD, marginBottom: 8, fontSize: "1.75rem" }}>{title}</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 16, fontSize: 13 }}>Listing ref · {id.slice(0, 12)}…</p>

        <div style={{ marginBottom: 20 }}>
          <ListingUserProvidedDisclaimer />
        </div>

        <div style={{ marginBottom: 20 }}>
          <AIDealAnalyzerCard listingId={id} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <MortgageSimulator listingId={id} defaultOfferPriceUsd={listing?.illustrativePriceUsd} />
        </div>

        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ color: GOLD, marginBottom: 12, fontSize: "1.125rem" }}>Make an offer</h3>
          <p style={{ marginBottom: 16, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            Submit a structured offer for this listing. Sign in required — you&apos;ll track status in your dashboard.
          </p>
          <Link
            href={`/listings/${id}/offer`}
            style={{ ...buttonStyle, display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Make an Offer
          </Link>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: 16 }}>
            <ImmoContactTrustRow />
          </div>
          <h3 style={{ color: GOLD, marginBottom: 12, fontSize: "1.125rem" }}>Interested in this property?</h3>
          <p style={{ marginBottom: 20, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            Chat with our assistant first — a few quick questions, then we connect you with a broker. No long forms.
          </p>
          <button
            id="contact-button"
            type="button"
            onClick={() => {
              setCta("contact_broker");
              setChatOpen(true);
            }}
            style={buttonStyle}
          >
            Contact broker
          </button>
          <Link
            id="offer-button"
            href="/projects"
            style={{
              ...buttonStyle,
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              background: "transparent",
              color: GOLD,
              border: `1px solid rgba(201,169,110,0.35)`,
            }}
          >
            Browse new developments &amp; offers
          </Link>
          <button
            type="button"
            onClick={() => {
              if (scheduleBrokerId) {
                setVisitOpen(true);
              } else {
                setCta("book_visit");
                setChatOpen(true);
              }
            }}
            style={{
              ...buttonStyle,
              background: "transparent",
              color: GOLD,
              border: `1px solid ${GOLD}`,
            }}
          >
            Schedule a visit
          </button>
          <button
            type="button"
            onClick={() => {
              setCta("more_info");
              setChatOpen(true);
            }}
            style={{
              ...buttonStyle,
              background: "transparent",
              color: GOLD,
              border: `1px solid rgba(201,169,110,0.35)`,
            }}
          >
            Ask a question
          </button>
        </div>
      </div>
    </main>
  );
}
