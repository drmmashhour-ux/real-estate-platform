"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { canvaTemplates, TEMPLATE_CATEGORIES, getCanvaTemplateUrl, type CanvaTemplateCategory } from "@/lib/canva/templates";
import type { GeneratedListingContent } from "@/lib/ai/generateListingContent";

function TemplatePreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
        <span className="text-sm">No preview</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

const OPEN_OPTS = "noopener,noreferrer" as const;

function useFilteredTemplates(category: CanvaTemplateCategory | "all") {
  return useMemo(() => {
    if (category === "all") return canvaTemplates;
    return canvaTemplates.filter((t) => t.category === category);
  }, [category]);
}

type DesignAccessState = {
  status: "no-trial" | "active" | "expired" | "paid";
  daysRemaining: number | null;
};

export default function DesignTemplatesPage() {
  const [listingId, setListingId] = useState<string | null>(null);
  const [category, setCategory] = useState<CanvaTemplateCategory | "all">("all");
  const [aiContent, setAiContent] = useState<GeneratedListingContent | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [access, setAccess] = useState<DesignAccessState | null>(null);
  const [designAccessLoading, setDesignAccessLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const filtered = useFilteredTemplates(category);

  // Apply URL params on mount (avoids `useSearchParams()` Suspense requirement during build).
  useEffect(() => {
    const id =
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("listingId");
    setListingId(id);
  }, []);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  useEffect(() => {
    setDesignAccessLoading(true);
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
      .catch(() => setAccess(null))
      .finally(() => setDesignAccessLoading(false));
  }, []);

  useEffect(() => {
    const id = listingId;
    if (!id) {
      setAiContent(null);
      return;
    }
    setAiLoading(true);
    fetch("/api/ai/listing-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.title != null) setAiContent(data as GeneratedListingContent);
        else setAiContent(null);
      })
      .catch((err) => {
        console.error(err);
        setAiContent(null);
      })
      .finally(() => setAiLoading(false));
  }, [listingId]);

  const [recommendation, setRecommendation] = useState<{ recommendedTemplateId: string; reason: string } | null>(null);

  useEffect(() => {
    const id = listingId;
    if (!id) {
      setRecommendation(null);
      return;
    }
    fetch("/api/ai/recommend-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d) => d?.recommendedTemplateId != null && setRecommendation(d))
      .catch(() => setRecommendation(null));
  }, [listingId]);

  const useTemplate = (template: (typeof canvaTemplates)[number]) => {
    window.open(getCanvaTemplateUrl(template), "_blank", OPEN_OPTS);
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/design-access/checkout", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (!res.ok) {
        alert(data?.error ?? "Payments are not configured. Add Stripe keys to enable upgrades.");
        return;
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const canUseDesign = access && (access.status === "active" || access.status === "paid" || access.status === "no-trial");
  const accessBlocked = access && access.status === "expired";
  const trialActive = access?.status === "active" && access.daysRemaining != null;

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={listingId ? `/dashboard/listings/${listingId}` : "/dashboard/listings"}
            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ← Back to {listingId ? "listing" : "listings"}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Design templates</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Choose a template to open in Canva. You will edit in your own Canva account.
          </p>
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            You will edit this design in your own Canva account. Your designs stay private.
          </p>
          {!designAccessLoading && trialActive && access?.daysRemaining != null && (
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Trial ends in {access.daysRemaining} day{access.daysRemaining !== 1 ? "s" : ""}.
            </p>
          )}
          {!designAccessLoading && accessBlocked && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
              <p className="font-medium text-amber-800 dark:text-amber-200">Trial expired — upgrade to continue.</p>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {checkoutLoading ? "Loading…" : "Upgrade — $5"}
              </button>
            </div>
          )}
        </div>
      </section>

      {designAccessLoading && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      )}

      {!designAccessLoading && accessBlocked && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-slate-600 dark:text-slate-400">Design templates are available after you upgrade.</p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {checkoutLoading ? "Loading…" : "Upgrade — $5"}
            </button>
          </div>
        </div>
      )}

      {!designAccessLoading && !accessBlocked && (
      <div className={listingId ? "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" : "mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"}>
        <div className={listingId ? "flex gap-8 lg:flex-row" : ""}>
          <div className={listingId ? "min-w-0 flex-1 lg:max-w-[65%]" : ""}>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter:</span>
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  category === "all"
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                All
              </button>
              {TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    category === c.value
                      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {recommendation?.reason && listingId && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                <strong>Recommended:</strong> {recommendation.reason}
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((template) => {
                const isRecommended = recommendation?.recommendedTemplateId === template.id;
                return (
                <div
                  key={template.id}
                  className={`overflow-hidden rounded-xl border shadow-sm dark:bg-slate-900/60 ${
                    isRecommended ? "border-amber-500 ring-2 ring-amber-500/50" : "border-slate-200 bg-white dark:border-slate-800"
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800">
                    <TemplatePreview src={template.previewImage} alt={template.name} />
                    {isRecommended && (
                      <span className="absolute right-2 top-2 rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {template.category}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {template.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => useTemplate(template)}
                      className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ); })}
            </div>

            {filtered.length === 0 && (
              <p className="py-8 text-center text-slate-500 dark:text-slate-400">
                No templates in this category.
              </p>
            )}

            {listingId && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Save your design to this listing</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  After editing in Canva, go back to the listing dashboard and use &quot;Save Design&quot; to store your design.
                </p>
                <Link
                  href={`/dashboard/listings/${listingId}`}
                  className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Back to listing dashboard →
                </Link>
              </div>
            )}
          </div>

          {listingId && (
            <aside className="top-8 w-full shrink-0 lg:sticky lg:w-[340px]">
              {aiLoading && (
                <p className="text-sm text-slate-500">Loading AI content…</p>
              )}
              {aiContent && !aiLoading && (
                <div
                  style={{
                    background: "#1a1a1a",
                    padding: 15,
                    borderRadius: 10,
                    marginTop: 20,
                  }}
                >
                  <h3 style={{ margin: "0 0 10px", color: "#e5e5e5" }}>AI Content Ready</h3>
                  {typeof aiContent.score === "number" && (
                    <p style={{ margin: "0 0 8px", color: "#a3a3a3", fontSize: 14 }}>
                      <strong style={{ color: "#e5e5e5" }}>Score:</strong> {aiContent.score}/100
                    </p>
                  )}
                  {Array.isArray(aiContent.suggestions) && aiContent.suggestions.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ margin: "0 0 4px", color: "#e5e5e5", fontSize: 12 }}>Suggestions:</p>
                      <ul style={{ margin: 0, paddingLeft: 18, color: "#a3a3a3", fontSize: 12 }}>
                        {aiContent.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p style={{ margin: "0 0 6px", color: "#a3a3a3", fontSize: 14 }}>
                    <strong style={{ color: "#e5e5e5" }}>Title:</strong> {aiContent.title}
                  </p>
                  <p style={{ margin: "0 0 10px", color: "#a3a3a3", fontSize: 14 }}>
                    <strong style={{ color: "#e5e5e5" }}>Description:</strong> {aiContent.description}
                  </p>
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => copyText(aiContent.title, "title")}
                      className="rounded-lg border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      {copied === "title" ? "Copied!" : "Copy Title"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(aiContent.description, "description")}
                      className="rounded-lg border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      {copied === "description" ? "Copied!" : "Copy Description"}
                    </button>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
      )}
    </main>
    </>
  );
}
