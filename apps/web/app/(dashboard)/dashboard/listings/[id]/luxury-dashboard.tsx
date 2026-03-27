"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { canvaTemplates } from "@/lib/canva/templates";

const BG_DARK = "#0f0f0f";
const GOLD = "#C9A96E";

type ListingData = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  country: string;
  address?: string;
  nightPriceCents: number | null;
  photos?: string[];
  listingPhotos?: { url: string }[];
  beds?: number;
  baths?: number;
  maxGuests?: number;
};

type AiContent = {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
};

type AccessState = {
  status: "no-trial" | "active" | "expired" | "paid";
  daysRemaining: number | null;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded px-2 py-1 text-xs font-medium transition-colors"
      style={{ backgroundColor: "rgba(201, 169, 110, 0.2)", color: GOLD }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function LuxuryDashboard({ listing }: { listing: ListingData }) {
  const [aiContent, setAiContent] = useState<AiContent | null>(null);
  const [access, setAccess] = useState<AccessState | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const heroImage =
    (listing.listingPhotos?.length && listing.listingPhotos[0]?.url) ||
    (Array.isArray(listing.photos) && listing.photos[0]) ||
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200";

  const price = listing.nightPriceCents != null
    ? `€${(listing.nightPriceCents / 100).toFixed(0)}/night`
    : "Contact for price";
  const location = [listing.city, listing.country].filter(Boolean).join(", ") || listing.address || "";
  const stats = [
    listing.beds != null && { label: "Beds", value: listing.beds },
    listing.baths != null && { label: "Baths", value: listing.baths },
    listing.maxGuests != null && { label: "Guests", value: listing.maxGuests },
  ].filter(Boolean) as { label: string; value: number }[];

  useEffect(() => {
    fetch("/api/ai/listing-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
    })
      .then((res) => res.json())
      .then((data) => (data?.title != null ? setAiContent(data) : null))
      .catch(() => {});
  }, [listing.id]);

  useEffect(() => {
    fetch("/api/design/access", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status != null) {
          setAccess({ status: data.status, daysRemaining: data.daysRemaining ?? null });
        }
      })
      .catch(() => {});
  }, []);

  const useTemplate = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/design-access/checkout", { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (data?.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const canUseDesign = access && (access.status === "active" || access.status === "paid" || access.status === "no-trial");
  const storageUsed = 42;
  const storageLimit = 100;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_DARK }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/listings"
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: GOLD }}
        >
          ← Back to listings
        </Link>

        {/* Hero */}
        <section className="mt-8 overflow-hidden rounded-2xl">
          <div className="relative aspect-[21/9] w-full">
            <Image
              src={heroImage}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              unoptimized={heroImage.startsWith("http")}
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-8"
              style={{
                background: "linear-gradient(to top, rgba(15,15,15,0.95) 0%, transparent 60%)",
              }}
            >
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {listing.title}
              </h1>
              <p className="mt-2 text-lg" style={{ color: GOLD }}>
                {price}
                {location && ` · ${location}`}
              </p>
              {stats.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-6">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <span className="text-2xl font-semibold text-white">{s.value}</span>
                      <span className="ml-1 text-sm text-white/70">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Control Center */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">AI Control Center</h2>
          <p className="mt-1 text-sm text-white/60">Generate and optimize listing content with AI.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "rgba(201, 169, 110, 0.2)", color: GOLD }}
            >
              Generate AI Listing
            </button>
            <button
              type="button"
              className="rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "rgba(201, 169, 110, 0.2)", color: GOLD }}
            >
              Generate Marketing Text
            </button>
            <button
              type="button"
              className="rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "rgba(201, 169, 110, 0.2)", color: GOLD }}
            >
              Optimize Listing
            </button>
          </div>
        </section>

        {/* Design Studio + AI Content Panel */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Design Studio</h2>
          <p className="mt-1 text-sm text-white/60">Use templates in Canva. AI content is ready to copy on the right.</p>
          <div className="mt-6 flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              {canUseDesign ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {canvaTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div className="relative aspect-[4/3] w-full bg-white/5">
                        <Image
                          src={template.previewImage}
                          alt={template.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-white">{template.name}</h3>
                        <button
                          type="button"
                          onClick={() => useTemplate(template.canvaTemplateUrl)}
                          className="mt-3 w-full rounded-lg py-2 text-sm font-medium transition-opacity hover:opacity-90"
                          style={{ backgroundColor: GOLD, color: BG_DARK }}
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-xl border p-8 text-center"
                  style={{ borderColor: "rgba(201, 169, 110, 0.3)", backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                  <p className="text-white/80">Your trial expired — upgrade to continue.</p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="mt-4 rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: GOLD, color: BG_DARK }}
                  >
                    {checkoutLoading ? "Loading…" : "Upgrade ($5)"}
                  </button>
                </div>
              )}
            </div>
            <aside className="w-full shrink-0 lg:w-80">
              <div
                className="rounded-xl border p-6"
                style={{ borderColor: "rgba(201, 169, 110, 0.25)", backgroundColor: "rgba(0,0,0,0.2)" }}
              >
                <h3 className="font-semibold text-white">AI Content Ready</h3>
                <p className="mt-1 text-xs text-white/50">Copy into Canva. Keep this page open while you paste.</p>
                {aiContent ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white/50">Title</span>
                        <CopyButton value={aiContent.title ?? ""} />
                      </div>
                      <p className="mt-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                        {aiContent.title}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white/50">Description</span>
                        <CopyButton value={aiContent.description ?? ""} />
                      </div>
                      <p className="mt-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white line-clamp-3">
                        {aiContent.description}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white/50">Features</span>
                        <CopyButton value={(aiContent.features ?? []).join(", ")} />
                      </div>
                      <p className="mt-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                        {(aiContent.features ?? []).join(" · ")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/50">Loading AI content…</p>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* Storage Panel */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Storage</h2>
          <p className="mt-1 text-sm text-white/60">Usage and AI suggestions.</p>
          <div
            className="mt-4 rounded-xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Used</span>
              <span className="font-medium text-white">{storageUsed} GB / {storageLimit} GB</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${storagePercent}%`, backgroundColor: GOLD }}
              />
            </div>
            <p className="mt-3 text-xs text-amber-400/90">Alert: Storage above 80% — consider upgrading.</p>
            <p className="mt-2 text-xs text-white/50">AI suggestion: Archive old design exports to free space.</p>
          </div>
        </section>

        {/* Billing Panel */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Billing</h2>
          <p className="mt-1 text-sm text-white/60">Design trial and upgrades.</p>
          <div
            className="mt-4 rounded-xl border p-6"
            style={{ borderColor: "rgba(201, 169, 110, 0.25)", backgroundColor: "rgba(0,0,0,0.2)" }}
          >
            {access?.status === "active" && access.daysRemaining != null && (
              <p className="text-white/90">Trial ends in {access.daysRemaining} day{access.daysRemaining !== 1 ? "s" : ""}.</p>
            )}
            {access?.status === "paid" && <p className="text-white/90">Design access: Paid.</p>}
            {access?.status === "expired" && (
              <>
                <p className="text-amber-400/90">Your trial expired — upgrade to continue.</p>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="mt-3 rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: GOLD, color: BG_DARK }}
                >
                  {checkoutLoading ? "Loading…" : "Upgrade ($5)"}
                </button>
              </>
            )}
            {(access?.status === "no-trial" || !access) && (
              <p className="text-white/60">Start your 7-day trial when you use a template.</p>
            )}
            <Link
              href="/dashboard/billing"
              className="mt-3 inline-block text-sm font-medium hover:underline"
              style={{ color: GOLD }}
            >
              Billing &amp; invoices →
            </Link>
          </div>
        </section>

        {/* Analytics */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Analytics</h2>
          <p className="mt-1 text-sm text-white/60">Listing performance and insights.</p>
          <div
            className="mt-4 grid gap-4 rounded-xl border p-6 sm:grid-cols-2 lg:grid-cols-4"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-2xl font-semibold text-white">—</p>
              <p className="text-xs text-white/50">Views (30d)</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-2xl font-semibold text-white">—</p>
              <p className="text-xs text-white/50">Saves</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-2xl font-semibold text-white">—</p>
              <p className="text-xs text-white/50">Inquiries</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-2xl font-semibold text-white">—</p>
              <p className="text-xs text-white/50">Designs created</p>
            </div>
          </div>
        </section>

        {/* Listing details + actions */}
        <section className="mt-10">
          <div
            className="rounded-xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <h2 className="text-lg font-semibold text-white">Listing details</h2>
            <p className="mt-2 text-sm text-white/70">{listing.description || "No description yet."}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/bnhub/host/listings/${listing.id}/edit`}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ borderColor: "rgba(201, 169, 110, 0.5)", color: GOLD }}
              >
                Edit listing
              </Link>
              <Link
                href="/dashboard/billing"
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}
              >
                Billing &amp; invoices
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
