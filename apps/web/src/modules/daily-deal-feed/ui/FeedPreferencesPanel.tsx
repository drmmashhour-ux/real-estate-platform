"use client";

import { useState } from "react";

export function FeedPreferencesPanel() {
  const [city, setCity] = useState("");
  const [risk, setRisk] = useState("medium");

  async function save() {
    await fetch("/api/daily-deals/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredCities: city ? [city] : [], riskTolerance: risk }),
    }).catch(() => null);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <p className="text-sm font-semibold text-white">Feed preferences</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Preferred city"
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>
        <button onClick={save} className="rounded-lg bg-[#C9A646] px-3 py-2 text-sm font-semibold text-black hover:bg-[#e8c547]">Save</button>
      </div>
    </div>
  );
}
