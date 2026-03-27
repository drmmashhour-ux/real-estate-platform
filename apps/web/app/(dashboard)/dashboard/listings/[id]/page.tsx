"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { BuyerPropertyAiDock } from "@/components/ai/BuyerPropertyAiDock";
import { OpenContextConversationButton } from "@/components/messaging/OpenContextConversationButton";

const GOLD = "#C9A96E";
const DARK = "#0f0f0f";

type Listing = {
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  image: string;
} | null;

type AiAnalysis = {
  score: number;
  suggestions: string[];
  predictedPerformance: string;
  urgency: string;
  strengths: string[];
  weaknesses: string[];
} | null;

type AiContent = {
  title?: string;
  description?: string;
  features?: string[];
  score?: number;
  suggestions?: string[];
} | null;

type Storage = {
  used: string;
  limit: string;
  percent: number;
  status?: string;
} | null;

type Access = {
  status: "no-trial" | "active" | "expired" | "paid";
  daysRemaining?: number | null;
} | null;

type MarketingData = {
  title: string;
  description: string;
  canvaUrl: string;
  score?: number;
  suggestions?: string[];
} | null;

type AiOptimized = {
  optimizedTitle: string;
  optimizedDescription: string;
  seoKeywords: string[];
  improvements: string[];
} | null;

type AiMarketingBlock = {
  title: string;
  subtitle: string;
  shortDescription: string;
  longDescription: string;
  socialCaption: string;
  callToAction: string;
  score: number;
} | null;

type AiPredictions = {
  expectedLeadsPerWeek: number;
  conversionPotential: string;
  rankingPotential: string;
  confidence: number;
} | null;

type AiManager = {
  status: string;
  issues: string[];
  recommendedActions: string[];
} | null;

const MOCK_MARKETING = {
  title: "Luxury Villa in Montreal",
  description: "Modern luxury property with premium finishes.",
  canvaUrl: "https://www.canva.com/create/posters/",
};

export default function ListingDashboardPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [listing, setListing] = useState<Listing>(null);
  const [aiContent, setAiContent] = useState<AiContent>(null);
  const [storage, setStorage] = useState<Storage>(null);
  const [access, setAccess] = useState<Access>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marketingData, setMarketingData] = useState<MarketingData>(null);
  const [designStorage, setDesignStorage] = useState<{ storageUsed: number; storageLimit: number } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<"idle" | "success" | "error">("idle");
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(true);
  const [aiOptimized, setAiOptimized] = useState<AiOptimized>(null);
  const [aiMarketingBlock, setAiMarketingBlock] = useState<AiMarketingBlock>(null);
  const [aiPredictions, setAiPredictions] = useState<AiPredictions>(null);
  const [aiManager, setAiManager] = useState<AiManager>(null);

  const copyWithFeedback = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  const fetchDesignStorage = () => {
    fetch("/api/designs", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.storageUsed != null) {
          setDesignStorage({ storageUsed: data.storageUsed, storageLimit: data.storageLimit ?? 100 });
        }
      })
      .catch(() => {});
  };

  const generateMarketing = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/generate-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data?.title != null) {
        setAiMarketingBlock(data);
        setMarketingData({
          title: data.title,
          description: data.longDescription ?? data.shortDescription ?? "",
          canvaUrl: "https://www.canva.com/create/posters/",
          score: data.score,
        });
      } else {
        const fallback = await fetch(`/api/design-studio/payload?id=${encodeURIComponent(id)}`, { credentials: "same-origin" }).then((r) => r.json()).catch(() => ({}));
        setMarketingData({
          title: fallback.title ?? MOCK_MARKETING.title,
          description: fallback.description ?? MOCK_MARKETING.description,
          canvaUrl: fallback.canvaUrl ?? MOCK_MARKETING.canvaUrl,
          score: fallback.score ?? 72,
          suggestions: fallback.suggestions,
        });
      }
    } catch (err) {
      console.error("Marketing error:", err);
      setMarketingData({ ...MOCK_MARKETING, score: 72, suggestions: ["Add urgency words", "Include neighborhood name", "Use price anchoring"] });
    } finally {
      setLoading(false);
    }
  };

  const runOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/optimize-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data?.optimizedTitle != null) setAiOptimized(data);
    } catch {
      setAiOptimized(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    setListing({
      title: "Luxury Villa in Montreal",
      price: 850000,
      bedrooms: 4,
      bathrooms: 3,
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    });

    setAiAnalysisLoading(true);
    fetch(`/api/ai/analyze?listingId=${encodeURIComponent(id)}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.score != null) {
          setAiAnalysis({
            score: data.score,
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            predictedPerformance: data.predictedPerformance ?? "medium",
            urgency: data.urgency ?? "good",
            strengths: Array.isArray(data.strengths) ? data.strengths : [],
            weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          });
        }
      })
      .catch(() => setAiAnalysis(null))
      .finally(() => setAiAnalysisLoading(false));

    fetch("/api/ai/predict-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d) => d?.expectedLeadsPerWeek != null && setAiPredictions(d))
      .catch(() => {});

    fetch("/api/ai/property-manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d) => d?.status != null && setAiManager(d))
      .catch(() => {});

    fetch("/api/ai/listing-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then(setAiContent)
      .catch(() => {});

    fetch("/api/storage/status", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.percent !== undefined) {
          setStorage({
            used: data.used ?? "0B",
            limit: data.limit ?? "0B",
            percent: data.percent ?? 0,
            status: data.status,
          });
        }
      })
      .catch(() => {});

    fetch("/api/design/access", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status != null) {
          setAccess({
            status: data.status,
            daysRemaining: data.daysRemaining ?? null,
          });
        }
      })
      .catch(() => {});

    fetchDesignStorage();
  }, [id]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/design-access/checkout", { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (!res.ok) {
        alert(data?.error ?? "Payments are not configured. Add Stripe keys to enable upgrades.");
        return;
      }
      alert("Could not start checkout. Please try again.");
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    border: "1px solid rgba(201, 169, 110, 0.2)",
  };

  const buttonStyle = {
    background: GOLD,
    color: DARK,
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer" as const,
    marginRight: 8,
    marginTop: 8,
  };

  if (!id) {
    return (
      <div style={{ background: DARK, color: "white", minHeight: "100vh", padding: 20 }}>
        <p>Invalid listing.</p>
        <Link href="/dashboard/listings" style={{ color: GOLD }}>
          ← Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: DARK, color: "white", minHeight: "100vh", padding: 20 }}>
      <Link href="/dashboard/listings" style={{ color: GOLD, marginBottom: 20, display: "inline-block" }}>
        ← Back to listings
      </Link>

      {/* Hero */}
      <div style={cardStyle}>
        <img
          src={listing?.image}
          alt=""
          style={{ width: "100%", borderRadius: 12, marginBottom: 16, objectFit: "cover", maxHeight: 400 }}
        />
        <h1 style={{ color: GOLD, margin: 0, fontSize: "1.75rem" }}>{listing?.title}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>
          ${listing?.price?.toLocaleString()} · {listing?.bedrooms} beds · {listing?.bathrooms} baths
        </p>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 11,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.35)",
          }}
          title="Internal dashboard listing reference"
        >
          Ref {id.slice(0, 10)}…{id.slice(-6)}
        </p>
        <div style={{ marginTop: 16 }}>
          <OpenContextConversationButton
            contextType="listing"
            contextId={id}
            label="Message broker"
            demoListingId={id}
          />
        </div>
      </div>

      {/* AI Action Center — Overview (auto-loaded) */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>AI Overview</h2>
        {aiAnalysisLoading && <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading AI analysis…</p>}
        {!aiAnalysisLoading && !aiAnalysis && <p style={{ color: "rgba(255,255,255,0.6)" }}>AI insights temporarily unavailable.</p>}
        {!aiAnalysisLoading && aiAnalysis && (
          <>
            <p style={{ marginBottom: 8 }}><strong>Score:</strong> {aiAnalysis.score}/100 · <strong>Performance:</strong> {aiAnalysis.predictedPerformance} · <strong>Urgency:</strong> {aiAnalysis.urgency}</p>
            <div style={{ width: "100%", height: 8, background: "#333", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${Math.min(100, aiAnalysis.score)}%`, height: "100%", background: aiAnalysis.score >= 70 ? "#22c55e" : GOLD, borderRadius: 4 }} />
            </div>
            {aiAnalysis.strengths?.length > 0 && (
              <p style={{ marginBottom: 4, fontSize: 13 }}><strong>Strengths:</strong> {aiAnalysis.strengths.join(" · ")}</p>
            )}
            {aiAnalysis.weaknesses?.length > 0 && (
              <p style={{ marginBottom: 8, fontSize: 13 }}><strong>Weaknesses:</strong> {aiAnalysis.weaknesses.join(" · ")}</p>
            )}
            {aiAnalysis.suggestions?.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {aiAnalysis.suggestions.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
              </ul>
            )}
          </>
        )}
      </div>

      {/* AI Control Center */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>AI Control Center</h2>
        <p style={{ margin: "0 0 12px", fontSize: 12, opacity: 0.8 }}>Powered by AI Property Brain</p>
        <button
          style={buttonStyle}
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch("/api/ai/listing-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId: id }),
                credentials: "same-origin",
              });
              const data = await res.json().catch(() => ({}));
              if (data?.title != null) setAiContent(data);
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Generating…" : "Generate AI Listing"}
        </button>
        <button style={buttonStyle} onClick={generateMarketing} disabled={loading}>
          {loading ? "Generating..." : "Generate Marketing"}
        </button>
        <button style={buttonStyle} disabled={loading} onClick={runOptimize}>
          {loading ? "Optimizing…" : "Optimize Listing"}
        </button>

        {aiOptimized && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: GOLD, marginBottom: 12 }}>Optimized content</h3>
            <p style={{ marginBottom: 6 }}><strong>Title:</strong> {aiOptimized.optimizedTitle}</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiOptimized.optimizedTitle, "optTitle")}>
              {copyFeedback === "optTitle" ? "Copied!" : "Copy"}
            </button>
            <p style={{ margin: "12px 0 6px" }}><strong>Description:</strong> {aiOptimized.optimizedDescription.slice(0, 200)}…</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiOptimized.optimizedDescription, "optDesc")}>
              {copyFeedback === "optDesc" ? "Copied!" : "Copy"}
            </button>
            {aiOptimized.seoKeywords?.length > 0 && (
              <p style={{ marginTop: 12, fontSize: 12 }}>SEO: {aiOptimized.seoKeywords.slice(0, 6).join(", ")}</p>
            )}
          </div>
        )}

        {aiMarketingBlock && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(201,169,110,0.2)" }}>
            <h3 style={{ color: GOLD, marginBottom: 12 }}>Marketing blocks</h3>
            <p><strong>Title:</strong> {aiMarketingBlock.title}</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiMarketingBlock.title, "title")}>{copyFeedback === "title" ? "Copied!" : "Copy"}</button>
            <p style={{ marginTop: 12 }}><strong>Subtitle:</strong> {aiMarketingBlock.subtitle}</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiMarketingBlock.subtitle, "subtitle")}>{copyFeedback === "subtitle" ? "Copied!" : "Copy"}</button>
            <p style={{ marginTop: 12 }}><strong>Short:</strong> {aiMarketingBlock.shortDescription}</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiMarketingBlock.shortDescription, "short")}>{copyFeedback === "short" ? "Copied!" : "Copy"}</button>
            <p style={{ marginTop: 12 }}><strong>Social:</strong> {aiMarketingBlock.socialCaption}</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiMarketingBlock.socialCaption, "social")}>{copyFeedback === "social" ? "Copied!" : "Copy"}</button>
            <p style={{ marginTop: 12 }}><strong>CTA:</strong> {aiMarketingBlock.callToAction}</p>
            <button style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }} onClick={() => copyWithFeedback(aiMarketingBlock.callToAction, "cta")}>{copyFeedback === "cta" ? "Copied!" : "Copy"}</button>
            <button style={{ ...buttonStyle, marginTop: 12 }} onClick={() => window.open("https://www.canva.com/create/posters/", "_blank", "noopener,noreferrer")}>Open in Canva</button>
          </div>
        )}
        {marketingData && !aiMarketingBlock && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: GOLD, marginBottom: 12 }}>AI Marketing Content</h3>
            {typeof marketingData.score === "number" && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ marginBottom: 6 }}>
                  <strong>Score:</strong> {marketingData.score}/100
                </p>
                <div
                  style={{
                    width: "100%",
                    height: 10,
                    background: "#333",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, marketingData.score)}%`,
                      height: "100%",
                      background: marketingData.score >= 80 ? "#22c55e" : GOLD,
                      borderRadius: 5,
                    }}
                  />
                </div>
              </div>
            )}
            {Array.isArray(marketingData.suggestions) && marketingData.suggestions.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong>Suggestions:</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                  {marketingData.suggestions.map((s, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <p style={{ marginBottom: 8 }}>
              <strong>Title:</strong> {marketingData.title}
            </p>
            <button
              style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }}
              onClick={() => copyWithFeedback(marketingData.title, "title")}
            >
              {copyFeedback === "title" ? "Copied!" : "Copy Title"}
            </button>
            <p style={{ margin: "16px 0 8px" }}>
              <strong>Description:</strong> {marketingData.description}
            </p>
            <button
              style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }}
              onClick={() => copyWithFeedback(marketingData.description, "description")}
            >
              {copyFeedback === "description" ? "Copied!" : "Copy Description"}
            </button>
            <button
              style={{ ...buttonStyle, marginTop: 12 }}
              onClick={() => window.open(marketingData.canvaUrl, "_blank", "noopener,noreferrer")}
            >
              Open in Canva
            </button>
          </div>
        )}
      </div>

      {/* Design Studio (with trial lock) */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>Design Studio</h2>
        {access?.status === "active" && access.daysRemaining != null && access.daysRemaining <= 7 && (
          <p style={{ marginBottom: 12, color: "#fbbf24" }}>Trial ends in {access.daysRemaining} day{access.daysRemaining !== 1 ? "s" : ""}</p>
        )}
        {access?.status === "expired" ? (
          <div>
            <p style={{ marginBottom: 12 }}>Trial expired — upgrade to continue</p>
            <button style={buttonStyle} onClick={handleUpgrade} disabled={checkoutLoading}>
              {checkoutLoading ? "Loading…" : "Upgrade $5"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <button
              style={buttonStyle}
              onClick={() =>
                window.open(marketingData?.canvaUrl ?? "https://www.canva.com/create/posters/", "_blank", "noopener,noreferrer")
              }
            >
              Open Canva
            </button>
            <Link
              href={`/design-templates?listingId=${encodeURIComponent(id)}`}
              style={{
                ...buttonStyle,
                display: "inline-block",
                textDecoration: "none",
              }}
            >
              Design templates
            </Link>
            <button
              style={buttonStyle}
              onClick={async () => {
                setSaveFeedback("idle");
                try {
                  const res = await fetch("/api/designs/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: marketingData?.title ?? "Luxury Poster",
                      imageUrl: "https://via.placeholder.com/300",
                      listingId: id,
                    }),
                    credentials: "same-origin",
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setSaveFeedback("error");
                    setTimeout(() => setSaveFeedback("idle"), 3000);
                    return;
                  }
                  setSaveFeedback("success");
                  setTimeout(() => setSaveFeedback("idle"), 3000);
                  fetchDesignStorage();
                  if (storage) fetch("/api/storage/status", { credentials: "same-origin" }).then((r) => r.json()).then((d) => d.percent !== undefined && setStorage({ used: d.used ?? "0B", limit: d.limit ?? "0B", percent: d.percent ?? 0, status: d.status }));
                } catch {
                  setSaveFeedback("error");
                  setTimeout(() => setSaveFeedback("idle"), 3000);
                }
              }}
            >
              {saveFeedback === "success" ? "Saved!" : saveFeedback === "error" ? "Save failed" : "Save Design"}
            </button>
          </div>
        )}
      </div>

      {/* AI Content Panel */}
      {aiContent && (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>AI Content</h2>
          {typeof aiContent.score === "number" && (
            <p style={{ marginBottom: 12 }}>
              <strong>Score:</strong> {aiContent.score}/100
            </p>
          )}
          {Array.isArray(aiContent.suggestions) && aiContent.suggestions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong>Suggestions:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {aiContent.suggestions.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <p style={{ marginBottom: 8 }}>
            <strong>Title:</strong> {aiContent.title}
          </p>
          <button
            style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }}
            onClick={() => aiContent.title && navigator.clipboard.writeText(aiContent.title)}
          >
            Copy
          </button>
          <p style={{ margin: "16px 0 8px" }}>
            <strong>Description:</strong> {aiContent.description}
          </p>
          <button
            style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12 }}
            onClick={() => aiContent.description && navigator.clipboard.writeText(aiContent.description)}
          >
            Copy
          </button>
          <button
            style={{ ...buttonStyle, marginTop: 10 }}
            onClick={() =>
              window.open("https://www.canva.com/create/posters/", "_blank", "noopener,noreferrer")
            }
          >
            Open in Canva
          </button>
        </div>
      )}

      {/* Storage Panel */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>Storage</h2>
        {(designStorage != null || storage) && (
          <p style={{ marginBottom: 12 }}>
            {storage ? `${storage.used} / ${storage.limit}` : designStorage ? `${designStorage.storageUsed} MB / ${designStorage.storageLimit} MB` : "—"}
          </p>
        )}
        {!designStorage && !storage && (
          <p style={{ marginBottom: 12, color: "rgba(255,255,255,0.6)" }}>Loading storage…</p>
        )}
        {(storage || designStorage) && (
          <>
            <div
              style={{
                width: "100%",
                height: 10,
                background: "#333",
                borderRadius: 5,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, storage?.percent ?? (designStorage ? (designStorage.storageUsed / designStorage.storageLimit) * 100 : 0))}%`,
                  height: "100%",
                  background: (storage?.percent ?? (designStorage ? (designStorage.storageUsed / designStorage.storageLimit) * 100 : 0)) > 90 ? "#ef4444" : GOLD,
                  borderRadius: 5,
                }}
              />
            </div>
            {(storage?.percent ?? (designStorage ? (designStorage.storageUsed / designStorage.storageLimit) * 100 : 0)) > 90 && (
              <p style={{ marginTop: 12, color: "#f87171" }}>Almost full</p>
            )}
          </>
        )}
      </div>

      {/* Billing Panel */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>Billing</h2>
        {(() => {
          const isTrial = access?.status !== "paid";
          return (
            <>
              {isTrial && access?.status === "active" && <p style={{ marginBottom: 8 }}>7-day trial active</p>}
              <p style={{ marginBottom: 12 }}>
                Plan: {access?.status === "paid" ? "Paid" : "Trial"}
              </p>
              <button
                style={buttonStyle}
                onClick={handleUpgrade}
                disabled={checkoutLoading}
              >
                Upgrade Plan ($5)
              </button>
              <Link href="/dashboard/billing" style={{ color: GOLD, marginLeft: 12, display: "inline-block", marginTop: 8 }}>
                Billing &amp; invoices →
              </Link>
            </>
          );
        })()}
      </div>

      {/* AI Analytics */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>AI Analytics</h2>
        {aiPredictions ? (
          <>
            <p style={{ margin: "4px 0" }}><strong>Expected leads/week:</strong> {aiPredictions.expectedLeadsPerWeek}</p>
            <p style={{ margin: "4px 0" }}><strong>Conversion potential:</strong> {aiPredictions.conversionPotential}</p>
            <p style={{ margin: "4px 0" }}><strong>Ranking potential:</strong> {aiPredictions.rankingPotential}</p>
            <p style={{ margin: "4px 0" }}><strong>Confidence:</strong> {aiPredictions.confidence}%</p>
          </>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading predictions…</p>
        )}
      </div>

      {/* AI Property Manager */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>AI Property Manager</h2>
        {aiManager ? (
          <>
            <p style={{ marginBottom: 8 }}><strong>Status:</strong> {aiManager.status}</p>
            {aiManager.issues?.length > 0 && (
              <p style={{ marginBottom: 8, fontSize: 13 }}><strong>Issues:</strong> {aiManager.issues.join(" · ")}</p>
            )}
            {aiManager.recommendedActions?.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {aiManager.recommendedActions.map((a, i) => <li key={i} style={{ marginBottom: 4 }}>{a}</li>)}
              </ul>
            )}
          </>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading…</p>
        )}
      </div>

      {/* Hub AI (buyer-style insight + filters help) */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>AI assistant</h2>
        <BuyerPropertyAiDock
          listingId={id}
          title={listing?.title}
          price={listing?.price}
          bedrooms={listing?.bedrooms}
          bathrooms={listing?.bathrooms}
        />
      </div>

      {/* AI Chat */}
      <div style={cardStyle}>
        <AiChatPanel listingId={id} />
      </div>

      {/* Analytics Panel */}
      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 16px", color: GOLD, fontSize: "1.25rem" }}>Analytics</h2>
        <p style={{ margin: "4px 0" }}>Views: 120</p>
        <p style={{ margin: "4px 0" }}>Leads: 8</p>
        <p style={{ margin: "4px 0" }}>Engagement: High</p>
      </div>
    </div>
  );
}
