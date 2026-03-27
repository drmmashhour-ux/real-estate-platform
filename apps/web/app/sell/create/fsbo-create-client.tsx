"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploader } from "@/components/fsbo/ImageUploader";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { LegalActionWarningModal } from "@/components/legal/LegalActionWarningModal";
import { LegalReadinessPanel } from "@/components/legal/LegalReadinessPanel";
import { CONTENT_LICENSE_ERROR } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";
import { getFsboMaxPhotosForSellerPlan, type FsboPhotoType } from "@/lib/fsbo/photo-limits";

type ListingPayload = {
  title: string;
  description: string;
  price: string;
  address: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  surfaceSqft: string;
  images: string[];
  publishPlan: "basic" | "premium";
  contactEmail: string;
  contactPhone: string;
};

const emptyBase = {
  title: "",
  description: "",
  price: "",
  address: "",
  city: "",
  bedrooms: "",
  bathrooms: "",
  surfaceSqft: "",
  images: [] as string[],
  contactEmail: "",
  contactPhone: "",
};

function emptyWithPlan(plan: "basic" | "premium"): ListingPayload {
  return { ...emptyBase, publishPlan: plan };
}

export function FsboCreateClient({
  publishFeeBasicCents,
  publishFeePremiumCents,
  defaultPlan,
  stripeLikelyOn,
}: {
  publishFeeBasicCents: number;
  publishFeePremiumCents: number;
  defaultPlan: "basic" | "premium";
  stripeLikelyOn: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qId = searchParams.get("id");

  const [listingId, setListingId] = useState<string | null>(qId);
  const [photoTypes, setPhotoTypes] = useState<FsboPhotoType[]>([]);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [photoLimit, setPhotoLimit] = useState(5);
  const [form, setForm] = useState<ListingPayload>(() => emptyWithPlan(defaultPlan));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseVersion, setLicenseVersion] = useState<string>(CONTENT_LICENSE_VERSION);
  const [afterLicenseAction, setAfterLicenseAction] = useState<null | "save" | "publish">(null);
  const [legalWarnOpen, setLegalWarnOpen] = useState(false);
  const [legalWarnMessage, setLegalWarnMessage] = useState("");
  const pendingLegalRef = useRef<(() => void) | null>(null);
  const skipLegalPublishRef = useRef(false);
  const skipLegalSaveRef = useRef(false);

  const load = useCallback(async (id: string) => {
    const res = await fetch(`/api/fsbo/listings/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const l = data.listing;
    if (!l) return;
    setForm({
      title: l.title ?? "",
      description: l.description ?? "",
      price: l.priceCents ? String(l.priceCents / 100) : "",
      address: l.address ?? "",
      city: l.city ?? "",
      bedrooms: l.bedrooms != null ? String(l.bedrooms) : "",
      bathrooms: l.bathrooms != null ? String(l.bathrooms) : "",
      surfaceSqft: l.surfaceSqft != null ? String(l.surfaceSqft) : "",
      images: Array.isArray(l.images) ? [...l.images] : [],
      publishPlan: l.publishPlan === "premium" ? "premium" : "basic",
      contactEmail: l.contactEmail ?? "",
      contactPhone: l.contactPhone ?? "",
    });

    const images = Array.isArray(l.images) ? (l.images as string[]) : [];
    const rawTags = (l as any).photoTagsJson;
    const derived = Array.isArray(rawTags) ? rawTags.filter((t: unknown) => typeof t === "string").map((t: string) => t) : [];
    const normalized: FsboPhotoType[] =
      images.length > 0
        ? Array.from({ length: images.length }).map((_, i) => {
            const raw = derived[i] ?? "";
            const upper = typeof raw === "string" ? raw.toUpperCase() : "";
            const ok = upper === "EXTERIOR" || upper === "INTERIOR" || upper === "STREET_VIEW" || upper === "OTHER";
            const v = ok ? (upper as FsboPhotoType) : (i === 0 ? "EXTERIOR" : "OTHER");
            return v;
          })
        : [];
    if (normalized.length > 0) normalized[0] = "EXTERIOR";
    setPhotoTypes(normalized);
    setPhotoConfirmed(Boolean((l as any).photoConfirmationAcceptedAt));
  }, []);

  useEffect(() => {
    if (qId) {
      setListingId(qId);
      void load(qId);
    }
  }, [qId, load]);

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

  function bodyFromForm(): Record<string, unknown> {
    const price = Number.parseFloat(form.price.replace(/[^0-9.]/g, ""));
    return {
      title: form.title,
      description: form.description,
      priceCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
      address: form.address,
      city: form.city,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms, 10) : null,
      surfaceSqft: form.surfaceSqft ? parseInt(form.surfaceSqft, 10) : null,
      images: form.images,
      publishPlan: form.publishPlan,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone || null,
    };
  }

  async function saveDraft(): Promise<{ ok: boolean; id?: string }> {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = bodyFromForm();
      const currentId = listingId ?? qId;

      if (!skipLegalSaveRef.current && Array.isArray(payload.images) && payload.images.length > 0) {
        const ev = await fetch("/api/legal/ai/evaluate-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            hub: "seller",
            actionType: "save_listing_with_photos",
            entity: {
              title: payload.title,
              description: payload.description,
              imageCount: payload.images.length,
            },
          }),
        });
        const j = (await ev.json()) as { requiresConfirmation?: boolean; message?: string };
        if (ev.ok && j.requiresConfirmation && typeof j.message === "string") {
          setLegalWarnMessage(j.message);
          pendingLegalRef.current = () => {
            skipLegalSaveRef.current = true;
            setLegalWarnOpen(false);
            void saveDraft();
          };
          setLegalWarnOpen(true);
          return { ok: false };
        }
      }
      skipLegalSaveRef.current = false;

      if (!currentId) {
        const res = await fetch("/api/fsbo/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          requiredVersion?: string;
          id?: string;
        };
        if (!res.ok) {
          if (data.error === CONTENT_LICENSE_ERROR && data.requiredVersion) {
            setLicenseVersion(data.requiredVersion);
            setAfterLicenseAction("save");
            setLicenseModalOpen(true);
          }
          setErr(data.error ?? "Save failed");
          return { ok: false };
        }
        if (!data.id) {
          setErr("Save failed");
          return { ok: false };
        }
        setListingId(data.id);
        router.replace(`/sell/create?id=${encodeURIComponent(data.id)}`, { scroll: false });
        setMsg("Draft saved.");
        return { ok: true, id: data.id as string };
      }
      const res = await fetch(`/api/fsbo/listings/${currentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        requiredVersion?: string;
      };
      if (!res.ok) {
        if (data.error === CONTENT_LICENSE_ERROR && data.requiredVersion) {
          setLicenseVersion(data.requiredVersion);
          setAfterLicenseAction("save");
          setLicenseModalOpen(true);
        }
        setErr(data.error ?? "Save failed");
        return { ok: false };
      }
      setMsg("Draft updated.");
      return { ok: true, id: currentId };
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setErr(null);
    try {
      if (!photoConfirmed) {
        setErr("Confirm that uploaded photos represent the actual property before publishing.");
        return;
      }
      if (!skipLegalPublishRef.current) {
        const ev = await fetch("/api/legal/ai/evaluate-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            hub: "seller",
            actionType: "publish_listing",
            entity: {
              title: form.title,
              description: form.description,
              imageCount: form.images.length,
              contactEmail: form.contactEmail,
            },
          }),
        });
        const j = (await ev.json()) as { requiresConfirmation?: boolean; message?: string };
        if (ev.ok && j.requiresConfirmation && typeof j.message === "string") {
          setLegalWarnMessage(j.message);
          pendingLegalRef.current = () => {
            skipLegalPublishRef.current = true;
            setLegalWarnOpen(false);
            void publish();
          };
          setLegalWarnOpen(true);
          return;
        }
      }
      skipLegalPublishRef.current = false;

      const { ok, id: savedId } = await saveDraft();
      if (!ok || !savedId) return;

      // Store photo tags + required confirmation before the publish gate.
      await fetch(`/api/fsbo/listings/${savedId}/hub`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoTagsJson: photoTypes,
          photoConfirmationAccepted: true,
          photoVerificationStatusOverride: "VERIFIED",
        }),
      });

      const res = await fetch(`/api/fsbo/listings/${savedId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: form.publishPlan }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        requiredVersion?: string;
        freePublish?: boolean;
        url?: string;
      };
      if (!res.ok) {
        if (data.error === CONTENT_LICENSE_ERROR && data.requiredVersion) {
          setLicenseVersion(data.requiredVersion);
          setAfterLicenseAction("publish");
          setLicenseModalOpen(true);
        }
        setErr(data.error ?? "Could not start checkout");
        return;
      }
      if (data.freePublish) {
        setMsg("Listing published (dev / unpaid mode).");
        router.push("/dashboard/fsbo");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      setErr("Unexpected response");
    } finally {
      setPublishing(false);
    }
  }

  const basicDisplay = (publishFeeBasicCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
  });
  const premiumDisplay = (publishFeePremiumCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
  });
  const selectedPublishCents =
    form.publishPlan === "premium" ? publishFeePremiumCents : publishFeeBasicCents;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/sell" className="text-sm text-[#C9A646]">
        ← Browse FSBO
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-white">Create your listing</h1>
      <p className="mt-2 text-sm text-[#B3B3B3]">
        Save a draft anytime. Choose a plan, then pay to publish. Standard <strong className="text-[#C9A646]">{basicDisplay}</strong>
        {" · "}
        Featured <strong className="text-[#E8C547]">{premiumDisplay}</strong>
        {stripeLikelyOn ? " (secure checkout)." : " (enable Stripe or FSBO_ALLOW_UNPAID_PUBLISH for dev)."}
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-6">
        <div>
          <p className="text-sm font-medium text-[#E8E8E8]">Choose your selling plan</p>
          <p className="mt-1 text-xs text-[#888]">You must select a plan before publishing. Checkout charges the selected fee.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, publishPlan: "basic" }))}
              className={[
                "rounded-2xl border-2 p-5 text-left transition",
                "bg-[#0B0B0B] hover:border-[#C9A646]/60",
                form.publishPlan === "basic"
                  ? "border-[#C9A646] shadow-[0_0_0_1px_rgba(201, 166, 70,0.35)]"
                  : "border-white/15",
              ].join(" ")}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Basic</p>
              <p className="mt-2 text-2xl font-bold text-white">{basicDisplay}</p>
              <p className="mt-2 text-xs text-[#B3B3B3]">Standard directory listing on LECIPM.</p>
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, publishPlan: "premium" }))}
              className={[
                "relative rounded-2xl border-2 p-5 text-left transition",
                "bg-gradient-to-br from-[#1a1508] to-[#0B0B0B] hover:border-[#E8C547]/70",
                form.publishPlan === "premium"
                  ? "border-[#E8C547] shadow-[0_0_24px_rgba(232,197,71,0.12)]"
                  : "border-[#C9A646]/30",
              ].join(" ")}
            >
              <span className="absolute right-3 top-3 rounded-full bg-[#C9A646]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#E8C547]">
                Featured
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#E8C547]">Premium</p>
              <p className="mt-2 text-2xl font-bold text-white">{premiumDisplay}</p>
              <p className="mt-2 text-xs text-[#B3B3B3]">Highlighted placement in search & directory (featured window set after payment).</p>
            </button>
          </div>
          <p className="mt-3 text-xs text-[#666]">
            Selected checkout:{" "}
            <strong className="text-[#C9A646]">
              {(selectedPublishCents / 100).toLocaleString(undefined, { style: "currency", currency: "CAD" })}
            </strong>
          </p>
        </div>
        <Field label="Title" required>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </Field>
        <Field label="Description" required>
          <textarea
            rows={6}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (CAD)" required>
            <input
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>
          <Field label="City" required>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Address" required>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bedrooms">
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.bedrooms}
              onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.bathrooms}
              onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
            />
          </Field>
          <Field label="Surface (sq ft)">
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.surfaceSqft}
              onChange={(e) => setForm((f) => ({ ...f, surfaceSqft: e.target.value }))}
            />
          </Field>
        </div>
        <div className="block text-sm text-[#B3B3B3]">
          <span className="font-medium text-[#E8E8E8]">Photos</span>
          <p className="mt-1 text-xs text-[#888]">
            Upload listing photos (order = gallery order; first image is the cover). Save a draft first to unlock uploads.
          </p>
          <div className="mt-3">
            <ImageUploader
              listingId={listingId}
              images={form.images}
              onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
              photoTypes={photoTypes}
              onPhotoTypesChange={(types) => setPhotoTypes(types)}
              maxImages={photoLimit}
              disabled={saving || publishing}
            />
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={photoConfirmed}
              onChange={(e) => setPhotoConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm that uploaded photos represent the actual property (Exterior first). I understand this is
              not legal advice.
            </span>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email (shown when live)" required>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
          </Field>
          <Field label="Contact phone (optional)">
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </Field>
        </div>
      </div>

      <div className="mt-6">
        <LegalReadinessPanel listing={bodyFromForm()} />
      </div>

      {msg ? <p className="mt-4 text-sm text-emerald-400">{msg}</p> : null}
      {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void saveDraft()}
          disabled={saving}
          className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={publishing || saving}
          className="rounded-xl bg-[#C9A646] px-5 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-[#E8C547] disabled:opacity-50"
        >
          {publishing ? "Redirecting…" : "Publish listing"}
        </button>
        <Link href="/dashboard/fsbo" className="rounded-xl border border-[#C9A646]/40 px-5 py-3 text-sm text-[#C9A646]">
          My FSBO dashboard
        </Link>
      </div>

      <ContentLicenseModal
        open={licenseModalOpen}
        requiredVersion={licenseVersion}
        onClose={() => {
          setLicenseModalOpen(false);
          setAfterLicenseAction(null);
        }}
        onAccepted={() => {
          const next = afterLicenseAction;
          setLicenseModalOpen(false);
          setAfterLicenseAction(null);
          if (next === "publish") void publish();
          else void saveDraft();
        }}
      />

      <LegalActionWarningModal
        open={legalWarnOpen}
        message={legalWarnMessage}
        onCancel={() => {
          pendingLegalRef.current = null;
          setLegalWarnOpen(false);
        }}
        onConfirm={() => {
          const fn = pendingLegalRef.current;
          pendingLegalRef.current = null;
          fn?.();
        }}
      />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-[#B3B3B3]">
      {label}
      {required ? <span className="text-red-400"> *</span> : null}
      {children}
    </label>
  );
}
