"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AMENITY_KEYS,
  type AmenityKey,
  useHostNewListingWizard,
} from "@/stores/useHostNewListingWizard";

const TOTAL_STEPS = 7;

const STEPS = [
  "Basics",
  "Space",
  "Photos",
  "Amenities",
  "Price",
  "Description",
  "Publish",
] as const;

const PROPERTY_TYPES = ["Apartment", "House", "Condo", "Other"] as const;

const AMENITY_LABELS: Record<AmenityKey, string> = {
  wifi: "WiFi",
  kitchen: "Kitchen",
  parking: "Parking",
  tv: "TV",
  ac: "AC",
};

const INPUT_CLASS =
  "min-h-[48px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const BTN_PRIMARY =
  "min-h-[52px] rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50";

const BTN_SECONDARY =
  "min-h-[52px] rounded-2xl border border-white/20 py-4 text-base font-medium transition-all disabled:opacity-30";

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function MotionButton({
  variant = "primary",
  className = "",
  children,
  disabled,
  ...rest
}: Omit<ComponentProps<typeof motion.button>, "whileTap" | "whileHover"> & { variant?: "primary" | "secondary" | "ghost" }) {
  const base =
    variant === "primary"
      ? BTN_PRIMARY
      : variant === "secondary"
        ? BTN_SECONDARY
        : "min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium transition-all";
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={`${base} ${className} flex items-center justify-center gap-2`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

function mapLabelsToAmenities(labels: string[]) {
  const lower = labels.map((l) => l.toLowerCase());
  useHostNewListingWizard.setState((s) => {
    const next = { ...s.amenities };
    for (const key of AMENITY_KEYS) {
      const label = AMENITY_LABELS[key].toLowerCase();
      if (lower.some((l) => l === label || l.includes(label) || label.includes(l))) {
        next[key] = true;
      }
    }
    return { amenities: next };
  });
}

/** AI actions — high-contrast gradient + icon */
function AiActionButton({
  label,
  loading,
  disabled,
  onClick,
  variant = "gold",
  icon,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: "gold" | "violet";
  icon: string;
}) {
  const gradient =
    variant === "violet"
      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md shadow-violet-900/40 ring-2 ring-violet-400/30"
      : "bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-md shadow-amber-900/30 ring-2 ring-yellow-300/40";
  return (
    <motion.button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-black transition-all disabled:opacity-45 ${gradient}`}
    >
      <span className="text-lg" aria-hidden>
        {icon}
      </span>
      {loading ? (
        <>
          <Spinner className="h-5 w-5 text-black" />
          <span>Generating…</span>
        </>
      ) : (
        label
      )}
    </motion.button>
  );
}

function TrustFootnote() {
  return (
    <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
      Takes less than 1 minute · No commitment · You can edit anytime
    </p>
  );
}

function WizardProgressBar({ step }: { step: number }) {
  const pct = Math.min(100, Math.round((step / TOTAL_STEPS) * 100));
  return (
    <div className="mb-5 w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-2 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.45)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

async function compressImageFile(file: File, maxW = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 600_000) return file;
  try {
    const img = await createImageBitmap(file);
    const w = Math.min(maxW, img.width);
    const h = Math.round(img.height * (w / img.width));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) {
      img.close();
      return file;
    }
    ctx.drawImage(img, 0, 0, w, h);
    img.close();
    const blob = await new Promise<Blob | null>((res) =>
      c.toBlob((b) => res(b), "image/jpeg", quality)
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function HostSevenStepWizard() {
  const router = useRouter();
  const step = useHostNewListingWizard((s) => s.step);
  const busy = useHostNewListingWizard((s) => s.busy);
  const saveError = useHostNewListingWizard((s) => s.saveError);
  const saveAndGoNext = useHostNewListingWizard((s) => s.saveAndGoNext);
  const prevStep = useHostNewListingWizard((s) => s.prevStep);
  const reset = useHostNewListingWizard((s) => s.reset);

  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [exitingDraft, setExitingDraft] = useState(false);
  const [celebrate, setCelebrate] = useState<{ id: string; title: string } | null>(null);

  const draftId = useHostNewListingWizard((s) => s.draftListingId);

  const finishDraft = useCallback(async () => {
    if (!draftId) return;
    setPublishMsg(null);
    setExitingDraft(true);
    try {
      await fetch(`/api/host/listings/${draftId}/wizard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingStatus: "DRAFT" }),
      });
      reset();
      router.push("/host/listings");
    } finally {
      setExitingDraft(false);
    }
  }, [draftId, reset, router]);

  const finishPublish = useCallback(async () => {
    if (!draftId) return;
    setPublishMsg(null);
    const snap = useHostNewListingWizard.getState();
    const titleSnap = snap.title.trim() || snap.city.trim() || "Your stay";
    setPublishing(true);
    try {
      const r = await fetch(`/api/host/listings/${draftId}/publish`, { method: "POST" });
      const j = (await r.json()) as { error?: string; listing?: { id: string } };
      if (!r.ok) {
        setPublishMsg(j.error ?? "Something went wrong — try again.");
        if (j.listing?.id) {
          reset();
          router.push(`/bnhub/host/listings/${j.listing.id}/edit`);
        }
        return;
      }
      const publishedId = j.listing?.id;
      reset();
      if (publishedId) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setCelebrate({ id: publishedId, title: titleSnap });
        window.setTimeout(() => {
          router.push(`/bnhub/listings/${publishedId}`);
        }, 1800);
      } else {
        router.push("/host/listings");
      }
    } finally {
      setPublishing(false);
    }
  }, [draftId, reset, router]);

  return (
    <motion.main
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 pb-36 pt-6 text-white sm:px-6 sm:pb-28 sm:pt-8 md:pb-24"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {celebrate ? (
          <motion.div
            key="celebrate"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-6 backdrop-blur-md"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-sm rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center shadow-2xl shadow-emerald-900/20"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
            >
              <p className="text-5xl" aria-hidden>
                🎉
              </p>
              <p className="mt-4 text-xl font-bold text-white">Your listing is live!</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{celebrate.title}</p>
              <p className="mt-4 text-xs text-slate-500">Opening your public page…</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between gap-2">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href="/host/listings"
              className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-sm text-emerald-400 hover:underline"
            >
              ← Listings
            </Link>
          </motion.div>
          <span className="text-xs text-slate-500">
            {step} / {TOTAL_STEPS}
          </span>
        </div>

        <WizardProgressBar step={step} />

        <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-400/90">
          Auto-saves · No commitment
        </p>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          {step === 7 ? "Ready to publish?" : "List your place"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {step === 1
            ? "A few quick taps — we save as you go."
            : step === 7
              ? "Check the preview, then go live."
              : STEPS[step - 1]}
        </p>

        {saveError ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-100"
          >
            {saveError}
          </motion.p>
        ) : null}
        {publishMsg ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl bg-amber-500/15 px-3 py-2 text-sm text-amber-100"
          >
            {publishMsg}
          </motion.p>
        ) : null}

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="min-h-[120px]"
            >
              {step === 1 ? <StepBasics /> : null}
              {step === 2 ? <StepSpace /> : null}
              {step === 3 ? <StepPhotos /> : null}
              {step === 4 ? <StepAmenities /> : null}
              {step === 5 ? <StepPricing /> : null}
              {step === 6 ? <StepDescription /> : null}
              {step === 7 ? <StepPublish /> : null}
            </motion.div>
          </AnimatePresence>

          {step < 7 ? (
            <div className="mt-8 hidden gap-3 md:flex">
              <MotionButton
                variant="secondary"
                disabled={step === 1 || busy}
                onClick={() => prevStep()}
                className="flex-1"
              >
                Back
              </MotionButton>
              <MotionButton
                variant="primary"
                disabled={busy}
                onClick={() => void saveAndGoNext()}
                className="flex-1"
              >
                {busy ? (
                  <>
                    <Spinner className="h-5 w-5 text-slate-950" />
                    Saving…
                  </>
                ) : (
                  "Continue"
                )}
              </MotionButton>
            </div>
          ) : (
            <div className="mt-8 hidden flex-col gap-3 md:flex">
              <MotionButton
                variant="primary"
                disabled={!draftId || busy || publishing}
                onClick={() => void finishPublish()}
                className="w-full !min-h-[56px] !py-5 !text-lg"
              >
                {publishing ? (
                  <>
                    <Spinner className="h-6 w-6 text-slate-950" />
                    Publishing…
                  </>
                ) : (
                  "Publish"
                )}
              </MotionButton>
              <MotionButton
                variant="secondary"
                disabled={!draftId || busy || publishing || exitingDraft}
                onClick={() => void finishDraft()}
                className="w-full"
              >
                {exitingDraft ? (
                  <>
                    <Spinner className="h-5 w-5" />
                    Saving…
                  </>
                ) : (
                  "Save draft & exit"
                )}
              </MotionButton>
            </div>
          )}

          <div className="hidden md:block">
            <TrustFootnote />
          </div>
        </div>
      </div>

      {/* Sticky actions — mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden">
          {step < 7 ? (
            <div className="mx-auto flex max-w-lg gap-3">
              <MotionButton
                variant="secondary"
                disabled={step === 1 || busy}
                onClick={() => prevStep()}
                className="flex-1"
              >
                Back
              </MotionButton>
              <MotionButton
                variant="primary"
                disabled={busy}
                onClick={() => void saveAndGoNext()}
                className="flex-1 bg-[#D4AF37] text-black shadow-lg shadow-amber-900/30"
              >
                {busy ? (
                  <>
                    <Spinner className="h-5 w-5 text-black" />
                    Saving…
                  </>
                ) : (
                  "Next"
                )}
              </MotionButton>
            </div>
          ) : (
            <div className="mx-auto flex max-w-lg flex-col gap-2">
              <MotionButton
                variant="primary"
                disabled={!draftId || busy || publishing}
                onClick={() => void finishPublish()}
                className="w-full !min-h-[52px] bg-[#D4AF37] text-base text-black shadow-lg"
              >
                {publishing ? (
                  <>
                    <Spinner className="h-5 w-5 text-black" />
                    Publishing…
                  </>
                ) : (
                  "Publish"
                )}
              </MotionButton>
              <MotionButton
                variant="ghost"
                disabled={!draftId || busy || publishing || exitingDraft}
                onClick={() => void finishDraft()}
                className="w-full border border-white/20 text-slate-200"
              >
                {exitingDraft ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Saving…
                  </>
                ) : (
                  "Save draft & exit"
                )}
              </MotionButton>
            </div>
          )}
          <TrustFootnote />
        </div>
    </motion.main>
  );
}

function StepBasics() {
  const title = useHostNewListingWizard((s) => s.title);
  const city = useHostNewListingWizard((s) => s.city);
  const address = useHostNewListingWizard((s) => s.address);
  const propertyType = useHostNewListingWizard((s) => s.propertyType);
  const update = useHostNewListingWizard((s) => s.update);
  const [showStreet, setShowStreet] = useState(() => Boolean(address.trim()));

  return (
    <div className="space-y-4">
      <Field label="Name your place">
        <input
          className={INPUT_CLASS}
          value={title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Sunny loft near Old Port"
          autoComplete="off"
        />
      </Field>
      <Field label="City">
        <input
          className={INPUT_CLASS}
          value={city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Montreal"
          autoComplete="address-level2"
        />
      </Field>
      <Field label="Type">
        <select
          className={INPUT_CLASS}
          value={propertyType}
          onChange={(e) => update("propertyType", e.target.value)}
        >
          {PROPERTY_TYPES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      {!showStreet ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowStreet(true)}
          className="text-sm font-medium text-emerald-400/90 hover:text-emerald-300"
        >
          + Street address (optional)
        </motion.button>
      ) : (
        <Field label="Street (optional)">
          <input
            className={INPUT_CLASS}
            value={address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="You can add this later"
            autoComplete="street-address"
          />
        </Field>
      )}
    </div>
  );
}

function StepSpace() {
  const maxGuests = useHostNewListingWizard((s) => s.maxGuests);
  const bedrooms = useHostNewListingWizard((s) => s.bedrooms);
  const beds = useHostNewListingWizard((s) => s.beds);
  const baths = useHostNewListingWizard((s) => s.baths);
  const update = useHostNewListingWizard((s) => s.update);
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Guests">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          className={INPUT_CLASS}
          value={maxGuests}
          onChange={(e) => update("maxGuests", Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </Field>
      <Field label="Bedrooms">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={INPUT_CLASS}
          value={bedrooms}
          onChange={(e) => update("bedrooms", Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
      </Field>
      <Field label="Beds">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          className={INPUT_CLASS}
          value={beds}
          onChange={(e) => update("beds", Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </Field>
      <Field label="Baths">
        <select
          className={INPUT_CLASS}
          value={String(baths)}
          onChange={(e) => update("baths", Number(e.target.value))}
        >
          {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function StepPhotos() {
  const previewUrls = useHostNewListingWizard((s) => s.previewUrls);
  const setPhotosFromFileList = useHostNewListingWizard((s) => s.setPhotosFromFileList);
  const clearAllPhotos = useHostNewListingWizard((s) => s.clearAllPhotos);
  const removePhotoAt = useHostNewListingWizard((s) => s.removePhotoAt);
  const [skeleton, setSkeleton] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setSkeleton(true);
    try {
      const raw = Array.from(files);
      const compressed = await Promise.all(raw.map((f) => compressImageFile(f)));
      setPhotosFromFileList(compressed);
    } finally {
      window.setTimeout(() => setSkeleton(false), 400);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setShowAddedToast(true);
      toastTimer.current = setTimeout(() => setShowAddedToast(false), 2800);
    }
  }

  return (
    <div className="space-y-4">
      {previewUrls.length === 0 ? (
        <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/95">
          Add photos to attract more guests — your first one becomes the cover.
        </p>
      ) : null}

      {skeleton ? (
        <div className="relative aspect-[4/3] w-full animate-pulse overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-white/10" />
      ) : null}

      {!skeleton && previewUrls[0] ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-emerald-500/35 bg-black/40 shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
          <motion.img
            src={previewUrls[0]}
            alt=""
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            loading="eager"
          />
          <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black shadow-md">
            Cover photo
          </span>
        </div>
      ) : null}

      <motion.label
        whileTap={{ scale: 0.99 }}
        className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-400/25 bg-gradient-to-b from-white/[0.06] to-transparent px-4 py-8 transition hover:border-amber-400/45 hover:bg-white/[0.08]"
      >
        <span className="text-base font-semibold">Add photos</span>
        <span className="mt-1 text-xs text-slate-400">Tap to upload · first image = cover</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </motion.label>

      <AnimatePresence>
        {showAddedToast && previewUrls.length > 0 ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs font-medium text-emerald-400"
          >
            ✔ Added — you can add more
          </motion.p>
        ) : null}
      </AnimatePresence>

      {previewUrls.length > 0 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">{previewUrls.length} photo{previewUrls.length === 1 ? "" : "s"}</p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => clearAllPhotos()}
            className="min-h-[44px] text-xs font-medium text-rose-300/90 hover:text-rose-200"
          >
            Clear all
          </motion.button>
        </div>
      ) : null}

      {previewUrls.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {previewUrls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/15"
            >
              <motion.img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                loading="lazy"
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className="absolute bottom-0 right-0 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-tl-lg bg-black/75 text-sm font-medium text-white"
                onClick={() => removePhotoAt(i)}
                aria-label={`Remove photo ${i + 1}`}
              >
                ×
              </motion.button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StepAmenities() {
  const amenities = useHostNewListingWizard((s) => s.amenities);
  const toggleAmenity = useHostNewListingWizard((s) => s.toggleAmenity);
  const propertyType = useHostNewListingWizard((s) => s.propertyType);
  const [loading, setLoading] = useState(false);

  async function autoFill() {
    setLoading(true);
    try {
      const r = await fetch("/api/host/listing-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_amenities", propertyType }),
      });
      const j = (await r.json()) as { amenities?: string[] };
      if (j.amenities?.length) mapLabelsToAmenities(j.amenities);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AiActionButton
        label="Suggest amenities"
        loading={loading}
        onClick={() => void autoFill()}
        icon="⚡"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {AMENITY_KEYS.map((key) => (
          <label
            key={key}
            className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition active:scale-[0.99]"
          >
            <input
              type="checkbox"
              checked={amenities[key]}
              onChange={() => toggleAmenity(key)}
              className="h-5 w-5 rounded border-white/30"
            />
            <span className="text-sm font-medium">{AMENITY_LABELS[key]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function StepPricing() {
  const price = useHostNewListingWizard((s) => s.price);
  const update = useHostNewListingWizard((s) => s.update);
  const [suggested, setSuggested] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialSuggestDone, setInitialSuggestDone] = useState(false);
  const fetchedRef = useRef(false);

  async function fetchSuggestion(isManual = false) {
    const { city: c, bedrooms: br } = useHostNewListingWizard.getState();
    if (!c.trim()) {
      if (!isManual) setInitialSuggestDone(true);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/host/listing-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest_price", city: c, bedrooms: br }),
      });
      const j = (await r.json()) as { suggestedPrice?: number };
      if (typeof j.suggestedPrice === "number") setSuggested(j.suggestedPrice);
    } finally {
      setLoading(false);
      if (!isManual) setInitialSuggestDone(true);
    }
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchSuggestion(false);
  }, []);

  const showInitialLoading = loading && !initialSuggestDone && suggested == null;

  return (
    <div className="space-y-4">
      {showInitialLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-400">
          <Spinner className="h-5 w-5 text-emerald-400" />
          Generating…
        </div>
      ) : null}

      <AnimatePresence>
        {suggested != null ? (
          <motion.div
            key={suggested}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent p-4 ring-1 ring-emerald-400/20"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/90">Suggested</p>
            <p className="mt-1 text-3xl font-bold text-white">
              ${suggested}
              <span className="text-lg font-semibold text-slate-400"> / night</span>
            </p>
            <MotionButton
              variant="primary"
              onClick={() => update("price", suggested)}
              className="mt-4 w-full"
            >
              💰 Use ${suggested} / night
            </MotionButton>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Field label="Your price (CAD / night)">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={INPUT_CLASS}
          value={price}
          onChange={(e) => update("price", Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
      </Field>

      <AiActionButton
        label="Refresh price suggestion"
        loading={loading && initialSuggestDone}
        disabled={false}
        onClick={() => void fetchSuggestion(true)}
        icon="💰"
      />
    </div>
  );
}

function StepDescription() {
  const description = useHostNewListingWizard((s) => s.description);
  const update = useHostNewListingWizard((s) => s.update);
  const title = useHostNewListingWizard((s) => s.title);
  const city = useHostNewListingWizard((s) => s.city);
  const propertyType = useHostNewListingWizard((s) => s.propertyType);
  const maxGuests = useHostNewListingWizard((s) => s.maxGuests);
  const bedrooms = useHostNewListingWizard((s) => s.bedrooms);
  const amenities = useHostNewListingWizard((s) => s.amenities);
  const [loading, setLoading] = useState(false);
  const [descAnim, setDescAnim] = useState(0);

  async function optimize() {
    setLoading(true);
    try {
      const amenityList = AMENITY_KEYS.filter((k) => amenities[k]).map((k) => AMENITY_LABELS[k]);
      const r = await fetch("/api/host/listing-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize_description",
          title,
          city,
          propertyType,
          maxGuests,
          bedrooms,
          amenities: amenityList,
        }),
      });
      const j = (await r.json()) as { description?: string };
      if (j.description) {
        update("description", j.description);
        setDescAnim((n) => n + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AiActionButton
        label="Write description with AI"
        loading={loading}
        disabled={!city.trim()}
        onClick={() => void optimize()}
        variant="violet"
        icon="✨"
      />
      {!description.trim() ? (
        <p className="text-center text-sm text-slate-400">Let AI generate it for you — or write your own below.</p>
      ) : null}
      <Field label="Description">
        <motion.div
          key={descAnim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <textarea
            className={`${INPUT_CLASS} min-h-[140px] resize-y py-3`}
            value={description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Short and warm works best."
          />
        </motion.div>
      </Field>
    </div>
  );
}

function StepPublish() {
  const title = useHostNewListingWizard((s) => s.title);
  const city = useHostNewListingWizard((s) => s.city);
  const price = useHostNewListingWizard((s) => s.price);
  const maxGuests = useHostNewListingWizard((s) => s.maxGuests);
  const propertyType = useHostNewListingWizard((s) => s.propertyType);
  const previewUrls = useHostNewListingWizard((s) => s.previewUrls);
  const draftId = useHostNewListingWizard((s) => s.draftListingId);
  const displayTitle = title.trim() || (city.trim() ? `Stay in ${city}` : "Your listing");
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_32px_64px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <div className="relative">
          {previewUrls[0] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrls[0]}
                alt=""
                className="aspect-[16/10] w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-2xl font-bold text-white drop-shadow-md">{displayTitle}</p>
                <p className="mt-0.5 text-sm text-white/80">{city || "City"}</p>
                <div className="mt-3 inline-flex items-baseline gap-1 rounded-xl bg-white/15 px-4 py-2 backdrop-blur-md">
                  <span className="text-2xl font-bold text-emerald-300">${price}</span>
                  <span className="text-sm font-medium text-white/70">/ night</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 px-6 text-center">
              <p className="text-sm font-medium text-slate-400">No cover photo yet</p>
              <p className="text-xs text-slate-500">Add photos on step 3 to make this look like a real listing.</p>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold leading-snug text-white">{displayTitle}</p>
              <p className="mt-0.5 text-sm text-slate-400">{city || "City"}</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              {propertyType}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">From</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${price}
                <span className="text-base font-semibold text-slate-400"> / night</span>
              </p>
            </div>
            <p className="text-sm text-slate-400">Up to {maxGuests} guests</p>
          </div>
          {draftId ? (
            <p className="mt-3 text-xs text-slate-500">Draft saved · you’re ready to publish.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-300">{label}</p>
      {children}
    </div>
  );
}
