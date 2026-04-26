"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildListingSearchAssistantPrompt } from "@/lib/ai/booking-flow-prompts";
import { generateSocialProof } from "@/lib/ai/socialProof";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  async function fetchListings() {
    try {
      const params = new URLSearchParams();

      if (city) params.append("city", city);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const res = await fetch("/api/listings?" + params.toString());
      const data = await res.json();

      if (Array.isArray(data)) {
        setListings(data);
      } else {
        console.error("Expected array from /api/listings", data);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  async function askSearchAi() {
    const q = aiQuestion.trim() || "What should I look at first?";
    setAiBusy(true);
    setAiReply(null);
    try {
      const summary = listings.map((l) => ({
        id: l.id,
        title: l.title,
        city: l.city,
        price: l.price,
      }));
      const prompt = buildListingSearchAssistantPrompt(q, summary);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiReply(data.error || "AI error");
        return;
      }
      setAiReply(typeof data.response === "string" ? data.response : JSON.stringify(data.response));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <nav style={{ marginBottom: 24 }}>
        <Link href="/">Home</Link>
        {" · "}
        <Link href="/login">Login</Link>
      </nav>

      <h1>Listings</h1>

      {/* Filters */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="City"
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Min Price"
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Max Price"
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ padding: 8 }}
        />
        <button onClick={fetchListings} style={{ padding: "8px 16px", cursor: "pointer" }}>Search</button>
      </div>

      <section
        style={{
          marginBottom: 28,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          maxWidth: 720,
        }}
      >
        <h2 style={{ marginTop: 0 }}>AI search help</h2>
        <p style={{ fontSize: 14, color: "#555" }}>
          Uses the current result set below. Run a search first for best results.
        </p>
        <textarea
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          placeholder="e.g. Quiet place under 500k near downtown"
          rows={3}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <button
          type="button"
          onClick={() => void askSearchAi()}
          disabled={aiBusy}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          {aiBusy ? "Thinking…" : "Ask AI"}
        </button>
        {aiReply ? (
          <pre
            style={{
              marginTop: 12,
              whiteSpace: "pre-wrap",
              fontSize: 14,
              background: "#f9f9f9",
              padding: 12,
              borderRadius: 6,
            }}
          >
            {aiReply}
          </pre>
        ) : null}
      </section>

      {/* Listings */}
      {listings.length === 0 && <p>No listings found.</p>}

      {listings.map((l) => {
        const enriched = { ...l, socialProof: generateSocialProof(l) };
        return (
        <div key={l.id} style={{ marginBottom: 20, border: "1px solid #ccc", padding: 15, borderRadius: 8 }}>
          <h3>
            <a href={`/listings/${l.id}`}>{l.title}</a>
          </h3>
          <p>{l.city}, {l.country}</p>
          <p><strong>${l.price}</strong></p>
          {enriched.socialProof.length > 0 ? (
            <ul style={{ margin: "8px 0 0 0", paddingLeft: 18, color: "#0a0", fontSize: 14 }}>
              {enriched.socialProof.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
