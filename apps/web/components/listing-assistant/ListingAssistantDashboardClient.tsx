"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ComplianceCheckResult,
  FullListingAssistantBundle,
  ListingLanguage,
  PricingSuggestionResult,
} from "@/modules/listing-assistant/listing-assistant.types";
import { computeListingReadiness } from "@/modules/listing-assistant/listing-readiness.service";
import type { ListingVersionCompareResult } from "@/modules/listing-assistant/listing-version.types";
import { snapshotFromGeneratedContent } from "@/modules/listing-assistant/listing-version.types";
import {
  formatCentrisExportJson,
  formatCopyReadyCentrisText,
} from "@/modules/listing-assistant/listing-export.service";

const TYPES = ["HOUSE", "CONDO", "MULTI_UNIT", "TOWNHOUSE", "LAND", "OTHER"] as const;

type TabId = "content" | "compliance" | "pricing" | "seo" | "export";

type Props = {
  initialListingId?: string | null;
};

export function ListingAssistantDashboardClient({ initialListingId }: Props) {
  const [listingId, setListingId] = useState(initialListingId ?? "");
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState<(typeof TYPES)[number]>("HOUSE");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [priceMajor, setPriceMajor] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState<ListingLanguage>("en");

  const [bundle, setBundle] = useState<FullListingAssistantBundle | null>(null);
  const [pricing, setPricing] = useState<PricingSuggestionResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("content");

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editHighlights, setEditHighlights] = useState("");
  const [versions, setVersions] = useState<Array<{ id: string; phase: string; createdAt: string }>>([]);
  const [compareFrom, setCompareFrom] = useState("");
  const [compareTo, setCompareTo] = useState("");
  const [compareResult, setCompareResult] = useState<ListingVersionCompareResult | null>(null);

  const partialPayload = useCallback(() => {
    const bd = bedrooms.trim() ? Number(bedrooms) : undefined;
    const ba = bathrooms.trim() ? Number(bathrooms) : undefined;
    const sq = sqft.trim() ? Number(sqft) : undefined;
    const px = priceMajor.trim() ? Number(priceMajor) : undefined;
    return {
      city: city.trim() || undefined,
      listingType,
      bedrooms: Number.isFinite(bd) ? bd : undefined,
      bathrooms: Number.isFinite(ba) ? ba : undefined,
      sqft: Number.isFinite(sq) ? sq : undefined,
      priceMajor: Number.isFinite(px) ? px : undefined,
      existingDescription: notes.trim() || undefined,
    };
  }, [city, listingType, bedrooms, bathrooms, sqft, priceMajor, notes]);

  async function runGenerate() {
    setLoading("generate");
    setError(null);
    try {
      const res = await fetch("/api/listing/assistant/generate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listingId.trim() || undefined,
          partial: partialPayload(),
          language,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as FullListingAssistantBundle & { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Generation failed");
        setBundle(null);
        return;
      }
      if (!data.content || !data.compliance) {
        setError("Invalid response");
        setBundle(null);
        return;
      }
      setBundle(data as FullListingAssistantBundle);
      setTab("content");
    } catch {
      setError("Network error");
      setBundle(null);
    } finally {
      setLoading(null);
    }
  }

  async function runCheckOnDraft() {
    if (!bundle) return;
    setLoading("check");
    setError(null);
    try {
      const res = await fetch("/api/listing/assistant/check", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bundle.content.title,
          description: bundle.content.description,
          highlights: bundle.content.propertyHighlights,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as ComplianceCheckResult;
      if (!res.ok) {
        setError("Check failed");
        return;
      }
      setBundle((b) => (b ? { ...b, compliance: data } : b));
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function runPricing() {
    setLoading("pricing");
    setError(null);
    try {
      const res = await fetch("/api/listing/assistant/pricing", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listingId.trim() || undefined,
          listingType,
          currentPriceMajor: priceMajor.trim() ? Number(priceMajor) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Pricing failed");
        setPricing(null);
        return;
      }
      setPricing(data as PricingSuggestionResult);
      setTab("pricing");
    } catch {
      setError("Network error");
      setPricing(null);
    } finally {
      setLoading(null);
    }
  }

  function copyExportText() {
    if (!bundle) return;
    const text = formatCopyReadyCentrisText(bundle.centrisStructured);
    void navigator.clipboard.writeText(text);
  }

  function buildSnapshotForSave() {
    if (!bundle) return null;
    const highlights =
      editHighlights.trim() ?
        editHighlights.split("\n").map((l) => l.trim()).filter(Boolean)
      : bundle.content.propertyHighlights;
    return snapshotFromGeneratedContent({
      ...bundle.content,
      title: editTitle.trim() || bundle.content.title,
      description: editDescription.trim() || bundle.content.description,
      propertyHighlights: highlights,
    });
  }

  function isBrokerEdited(): boolean {
    if (!bundle) return false;
    const snap = buildSnapshotForSave();
    if (!snap) return false;
    const gen = snapshotFromGeneratedContent(bundle.content);
    return (
      snap.title !== gen.title ||
      snap.description !== gen.description ||
      JSON.stringify(snap.propertyHighlights) !== JSON.stringify(gen.propertyHighlights)
    );
  }

  async function runSaveDraft() {
    const id = listingId.trim();
    if (!id || !bundle) {
      setError("Listing ID and generated content required to save draft.");
      return;
    }
    const content = buildSnapshotForSave();
    if (!content) return;
    setLoading("save");
    setError(null);
    try {
      const res = await fetch("/api/listing/assistant/save-draft", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          content,
          brokerEdited: isBrokerEdited(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function runCompareVersions() {
    const id = listingId.trim();
    if (!id || !compareFrom || !compareTo) return;
    const res = await fetch(
      `/api/listing/assistant/versions?listingId=${encodeURIComponent(id)}&fromId=${encodeURIComponent(compareFrom)}&toId=${encodeURIComponent(compareTo)}`
    );
    const data = await res.json().catch(() => ({}));
    setCompareResult((data.compare as ListingVersionCompareResult | null) ?? null);
  }

  function downloadJson() {
    if (!bundle) return;
    const json = formatCentrisExportJson(bundle.centrisStructured);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lecipm-centris-export-${bundle.language}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "compliance", label: "Compliance" },
    { id: "pricing", label: "Pricing" },
    { id: "seo", label: "SEO" },
    { id: "export", label: "Export" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        The smartest way to create real estate listings —{" "}
        <strong className="text-white">broker validation required</strong>. No auto-posting to Centris or external MLS.
      </p>

      {localePrefix ?
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`${localePrefix}/dashboard/listings/assistant/operations`}
            className="font-semibold text-emerald-700 underline dark:text-emerald-400"
          >
            Open operations dashboard →
          </Link>
        </div>
      : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Property input</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Choose language first, then generate. Export is structured for manual paste only.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as ListingLanguage)}
              className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Listing ID (optional)
            <input
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            City
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Asset type
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value as (typeof TYPES)[number])}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Price (CAD)
            <input
              value={priceMajor}
              onChange={(e) => setPriceMajor(e.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Bedrooms
            <input
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Bathrooms
            <input
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Sq ft
            <input
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
          <label className="sm:col-span-2 text-sm text-slate-700 dark:text-slate-300">
            Broker notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runGenerate()}
            className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50"
          >
            {loading === "generate" ? "Generating…" : "✨ Generate listing"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runPricing()}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {loading === "pricing" ? "…" : "Suggest price band"}
          </button>
          <button
            type="button"
            disabled={loading !== null || !bundle || !listingId.trim()}
            onClick={() => void runSaveDraft()}
            className="rounded-xl border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
          >
            {loading === "save" ? "Saving…" : "Save to CRM draft"}
          </button>
        </div>
      </section>

      {bundle?.alerts && bundle.alerts.length > 0 ?
        <aside className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase text-slate-500">Assistant alerts</p>
          <ul className="mt-2 space-y-2 text-sm">
            {bundle.alerts.map((a) => (
              <li
                key={a.id}
                className={
                  a.severity === "critical" ? "text-red-700 dark:text-red-400"
                  : a.severity === "warning" ? "text-amber-800 dark:text-amber-300"
                  : "text-slate-700 dark:text-slate-300"
                }
              >
                <strong>{a.title}:</strong> {a.detail}
              </li>
            ))}
          </ul>
        </aside>
      : null}

      {readinessMerged ?
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/70">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Publish readiness</span>
          <span
            className={
              readinessMerged.readinessStatus === "HIGH_RISK" ? "rounded-full bg-red-100 px-3 py-1 text-red-900 dark:bg-red-950/60 dark:text-red-200"
              : readinessMerged.readinessStatus === "NEEDS_EDITS" ? "rounded-full bg-amber-100 px-3 py-1 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
              : "rounded-full bg-emerald-100 px-3 py-1 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
            }
          >
            {readinessMerged.readinessStatus} · {readinessMerged.readinessScore}/100
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {readinessMerged.topBlockers[0] ?? "No blockers flagged."}
          </span>
        </div>
      : null}

      {bundle && listingId.trim() ?
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Version comparison</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Compare recorded snapshots (original baseline → AI iterations → broker saves).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={compareFrom}
              onChange={(e) => setCompareFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="">From…</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.phase} · {new Date(v.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
            <select
              value={compareTo}
              onChange={(e) => setCompareTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="">To…</option>
              {versions.map((v) => (
                <option key={`${v.id}-to`} value={v.id}>
                  {v.phase} · {new Date(v.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void runCompareVersions()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Compare
            </button>
          </div>
          {compareResult ?
            <ul className="mt-4 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
              {compareResult.segments.map((s) => (
                <li key={s.field + s.summary}>
                  <strong>{s.field}:</strong> {s.summary}
                </li>
              ))}
            </ul>
          : null}
        </section>
      : null}

      {bundle ?
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Broker refinements (optional)</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Edit before saving to CRM draft. Leave blank to use the generated text.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">
              Title
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={bundle.content.title}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="text-sm">
              Description
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={bundle.content.description.slice(0, 120) + "…"}
                rows={5}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
            <label className="text-sm">
              Highlights (one per line)
              <textarea
                value={editHighlights}
                onChange={(e) => setEditHighlights(e.target.value)}
                placeholder={bundle.content.propertyHighlights.join("\n")}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              />
            </label>
          </div>
        </section>
      : null}

      {bundle ? (
        <>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  tab === t.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "content" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Listing content</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase dark:bg-slate-800">
                  {bundle.language}
                </span>
              </div>
              <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Title</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">{bundle.content.title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Description</p>
                  <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
                    {bundle.content.description}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Highlights</p>
                  <ul className="mt-1 list-inside list-disc">
                    {bundle.content.propertyHighlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/80">
                  <p className="text-xs font-semibold uppercase text-slate-500">Listing performance score</p>
                  <p className="mt-2 font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {bundle.listingPerformance.listingScore}
                    <span className="text-lg font-normal text-slate-500">/100</span>
                  </p>
                  <ul className="mt-3 list-inside list-disc text-xs text-slate-600 dark:text-slate-400">
                    {bundle.listingPerformance.improvementSuggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "compliance" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compliance</h2>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Risk:</span>{" "}
                <span
                  className={
                    bundle.compliance.riskLevel === "HIGH"
                      ? "text-red-600"
                      : bundle.compliance.riskLevel === "MEDIUM"
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }
                >
                  {bundle.compliance.riskLevel}
                </span>{" "}
                · <span className="font-semibold">Pass:</span> {bundle.compliance.compliant ? "Yes" : "Needs edits"}
              </p>
              <ul className="mt-3 list-inside list-disc text-sm text-slate-600 dark:text-slate-400">
                {bundle.compliance.warnings.map((w) => (
                  <li key={w.slice(0, 90)}>{w}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void runCheckOnDraft()}
                className="mt-4 text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
              >
                Re-run compliance check
              </button>
            </section>
          ) : null}

          {tab === "pricing" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pricing</h2>
              {!pricing ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Click “Suggest price band” above to load peer-based bands (illustrative).
                </p>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/80">
                    <p className="text-xs font-semibold uppercase text-slate-500">Pricing transparency</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{pricing.rationale}</p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase text-slate-500">CRM peers matched</dt>
                        <dd className="font-semibold">{pricing.comparableCount}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Confidence</dt>
                        <dd className="font-semibold">{pricing.confidenceLevel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Band</dt>
                        <dd>
                          ${pricing.priceBandLow.toLocaleString()} – ${pricing.priceBandHigh.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Competitiveness</dt>
                        <dd>{Math.round(pricing.competitivenessScore)}/100</dd>
                      </div>
                    </dl>
                    {pricing.thinDataWarning ?
                      <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">
                        Caution: thin peer sample — widen comps manually before relying on this band.
                      </p>
                    : null}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {tab === "seo" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">SEO & targeting</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Google-friendly title</p>
                  <p className="mt-1 font-mono text-slate-900 dark:text-white">{bundle.seo.googleTitle}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Meta description</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{bundle.seo.metaDescription}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Keywords</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{bundle.seo.keywords.join(", ")}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase text-slate-500">Buyer targeting</p>
                  <p className="mt-2">
                    <span className="font-medium">Profile:</span> {bundle.buyerTargeting.targetBuyer}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Strategy:</span> {bundle.buyerTargeting.strategy}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "export" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Centris-ready export</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Structured JSON and plain text for manual paste — never auto-posted.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => downloadJson()}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600"
                >
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={() => copyExportText()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  Copy paste-ready text
                </button>
              </div>
              <button
                type="button"
                onClick={() => copyExportText()}
                className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-black hover:brightness-110 sm:w-auto sm:px-8"
              >
                Export for Centris (copy)
              </button>
              <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
                {formatCentrisExportJson(bundle.centrisStructured)}
              </pre>
            </section>
          ) : null}
        </>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
