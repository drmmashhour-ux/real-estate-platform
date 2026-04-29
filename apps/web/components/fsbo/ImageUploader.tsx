"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  FSBO_ALLOWED_IMAGE_MIME,
  FSBO_MAX_IMAGE_BYTES,
  FSBO_MAX_LISTING_IMAGES,
} from "@/lib/fsbo/media-config";
import type { FsboPhotoType } from "@/lib/fsbo/photo-limits";
import { FSBO_PHOTO_TYPES } from "@/lib/fsbo/photo-limits";
import { humanizeQualityIssues } from "@/lib/images/quality-issue-labels";

type Props = {
  listingId: string | null;
  images: string[];
  onChange: (urls: string[]) => void;
  photoTypes?: FsboPhotoType[];
  onPhotoTypesChange?: (types: FsboPhotoType[]) => void;
  disabled?: boolean;
  /** Defaults to FSBO_MAX_LISTING_IMAGES from media-config */
  maxImages?: number;
  /** Highest-scoring gallery index for cover suggestion (server-ranked). */
  recommendedCoverIndex?: number | null;
  /** Server-side scoring in progress */
  coverRankBusy?: boolean;
};

const GOLD = "var(--color-premium-gold)";

type EnhancementMeta = {
  originalUrl: string;
  fullUrl: string;
  thumbUrl: string;
  previewUrl: string;
  /** When true, listing stores optimized full URL */
  useOptimized: boolean;
  /** Bumps after re-processing so the browser reloads the same path */
  cacheBust?: number;
};

function stripUrlQuery(u: string): string {
  return u.split(/[?#]/)[0] ?? u;
}

type PhotoQualityMeta = {
  score: number;
  tier: "reject" | "warn" | "good";
  issues: string[];
};

function qualityTierBadgeClass(tier: PhotoQualityMeta["tier"]): string {
  if (tier === "good") return "bg-emerald-500/20 text-emerald-100 ring-emerald-400/30";
  if (tier === "warn") return "bg-amber-500/15 text-amber-50 ring-amber-400/35";
  return "bg-zinc-600/35 text-zinc-100 ring-white/15";
}

function acceptAttribute(): string {
  // Keep client-side accept aligned with server-side support.
  // HEIC/HEIF are converted to JPG on the server.
  return [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].join(",");
}

type FsboUploadOpts = { qualityOverride?: boolean; skipSmartCrop?: boolean };

export function ImageUploader({
  listingId,
  images,
  onChange,
  photoTypes,
  onPhotoTypesChange,
  disabled = false,
  maxImages = FSBO_MAX_LISTING_IMAGES,
  recommendedCoverIndex = null,
  coverRankBusy = false,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhanceByIndex, setEnhanceByIndex] = useState<(EnhancementMeta | null)[]>([]);
  const [improveIdx, setImproveIdx] = useState<number | null>(null);
  const [autoImproveIdx, setAutoImproveIdx] = useState<number | null>(null);
  const [qualityByIndex, setQualityByIndex] = useState<(PhotoQualityMeta | null)[]>([]);
  const [pendingReject, setPendingReject] = useState<{ file: File } | null>(null);

  const enhanceAligned = useMemo(() => {
    const next = enhanceByIndex.slice(0, images.length);
    while (next.length < images.length) next.push(null);
    return next;
  }, [images.length, enhanceByIndex]);

  const qualityAligned = useMemo(() => {
    const next = qualityByIndex.slice(0, images.length);
    while (next.length < images.length) next.push(null);
    return next;
  }, [images.length, qualityByIndex]);

  const canAdd = images.length < maxImages;
  const blocked = disabled || !listingId || !canAdd;
  const galleryFull = listingId && !canAdd && !disabled;

  const validateFile = (file: File): string | null => {
    const type = (file.type || "").toLowerCase();
    const name = file.name || "";
    const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : undefined;

    const isAllowedByMime = type ? FSBO_ALLOWED_IMAGE_MIME.has(type) : false;
    const isHeic = type === "image/heic" || type === "image/heif";
    const isAllowedByExt =
      ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "heic" || ext === "heif";

    if (!(isAllowedByMime || isHeic || isAllowedByExt)) {
      return "Upload failed. Please check file format or size.";
    }
    if (file.size > FSBO_MAX_IMAGE_BYTES) {
      return "Each image must be 10MB or smaller.";
    }
    return null;
  };

  const setPhotoTypesSafely = useCallback(
    (nextUrls: string[]) => {
      if (!onPhotoTypesChange) return;
      const current = Array.isArray(photoTypes) ? photoTypes : [];
      const next: FsboPhotoType[] = [];
      for (let j = 0; j < nextUrls.length; j++) {
        const fallback: FsboPhotoType = j === 0 ? "EXTERIOR" : "OTHER";
        next[j] = (current[j] ?? fallback) as FsboPhotoType;
      }
      if (next.length > 0) next[0] = "EXTERIOR"; // first photo required
      onPhotoTypesChange(next);
    },
    [onPhotoTypesChange, photoTypes],
  );

  const uploadOne = useCallback(
    async (file: File, opts?: FsboUploadOpts) => {
      if (!listingId) return;
      const v = validateFile(file);
      if (v) {
        setError(v);
        return;
      }
      setError(null);
      setPendingReject(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        if (opts?.qualityOverride) fd.set("qualityOverride", "true");
        if (opts?.skipSmartCrop) fd.set("skipSmartCrop", "true");
        const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/upload`, {
          method: "POST",
          body: fd,
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          rejected?: boolean;
          url?: string;
          urls?: { original: string; thumb: string; preview: string; full: string };
          quality?: { score: number; issues: string[] };
          tier?: PhotoQualityMeta["tier"];
        };
        if (res.status === 422 && data.rejected) {
          setPendingReject({ file });
          setError(typeof data.error === "string" ? data.error : "Image quality is too low.");
          return;
        }
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Upload failed");
          return;
        }
        const url = typeof data.url === "string" ? data.url : "";
        if (!url) {
          setError("Invalid server response");
          return;
        }
        const urls = data.urls;
        const qMeta: PhotoQualityMeta | null =
          typeof data.quality?.score === "number" && data.tier
            ? {
                score: data.quality.score,
                tier: data.tier,
                issues: Array.isArray(data.quality.issues) ? data.quality.issues : [],
              }
            : null;
        const nextUrls = [...images, url].slice(0, maxImages);
        onChange(nextUrls);
        setEnhanceByIndex((prev) => {
          const next = [...prev];
          while (next.length < nextUrls.length - 1) next.push(null);
          const last = nextUrls.length - 1;
          if (
            urls &&
            typeof urls.original === "string" &&
            typeof urls.full === "string" &&
            typeof urls.thumb === "string" &&
            typeof urls.preview === "string"
          ) {
            next[last] = {
              originalUrl: stripUrlQuery(urls.original),
              fullUrl: stripUrlQuery(urls.full),
              thumbUrl: stripUrlQuery(urls.thumb),
              previewUrl: stripUrlQuery(urls.preview),
              useOptimized: true,
              cacheBust: Date.now(),
            };
          } else {
            next[last] = null;
          }
          return next.slice(0, nextUrls.length);
        });
        setQualityByIndex((prev) => {
          const next = [...prev];
          while (next.length < nextUrls.length - 1) next.push(null);
          next[nextUrls.length - 1] = qMeta;
          return next.slice(0, nextUrls.length);
        });
        setPhotoTypesSafely(nextUrls);
      } finally {
        setUploading(false);
      }
    },
    [images, listingId, maxImages, onChange, setPhotoTypesSafely],
  );

  const improvePhotoAt = useCallback(
    async (index: number) => {
      if (!listingId || !images[index]) return;
      setError(null);
      setImproveIdx(index);
      try {
        const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/photos/improve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: images[index] }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          url?: string;
          urls?: { full?: string; preview?: string; thumb?: string };
        };
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Could not improve photo");
          return;
        }
        const newUrl = typeof data.url === "string" ? data.url : "";
        const o = data.urls?.original;
        const f = data.urls?.full;
        const thumb = data.urls?.thumb;
        const preview = data.urls?.preview;
        if (newUrl && typeof f === "string") {
          const useOpt = enhanceAligned[index]?.useOptimized ?? true;
          const nextImg = [...images];
          nextImg[index] = useOpt
            ? stripUrlQuery(f)
            : typeof o === "string"
              ? stripUrlQuery(o)
              : stripUrlQuery(newUrl);
          onChange(nextImg);
          setEnhanceByIndex((prev) => {
            const copy = [...prev];
            const cur = copy[index];
            copy[index] = {
              originalUrl: typeof o === "string" ? stripUrlQuery(o) : cur?.originalUrl ?? stripUrlQuery(images[index]),
              fullUrl: stripUrlQuery(f),
              thumbUrl: typeof thumb === "string" ? stripUrlQuery(thumb) : cur?.thumbUrl ?? "",
              previewUrl: typeof preview === "string" ? stripUrlQuery(preview) : cur?.previewUrl ?? "",
              useOptimized: cur?.useOptimized ?? true,
              cacheBust: Date.now(),
            };
            return copy;
          });
        }
      } finally {
        setImproveIdx(null);
      }
    },
    [images, listingId, onChange, enhanceAligned],
  );

  const autoImprovePhotoAt = useCallback(
    async (index: number) => {
      if (!listingId || !images[index]) return;
      setError(null);
      setAutoImproveIdx(index);
      try {
        const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/photos/improve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: images[index], smartCrop: true }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          url?: string;
          urls?: { original?: string; full?: string; preview?: string; thumb?: string };
        };
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Could not auto-improve photo");
          return;
        }
        const newUrl = typeof data.url === "string" ? data.url : "";
        const o = data.urls?.original;
        const f = data.urls?.full;
        const thumb = data.urls?.thumb;
        const preview = data.urls?.preview;
        if (newUrl && typeof f === "string") {
          const useOpt = enhanceAligned[index]?.useOptimized ?? true;
          const nextImg = [...images];
          nextImg[index] = useOpt
            ? stripUrlQuery(f)
            : typeof o === "string"
              ? stripUrlQuery(o)
              : stripUrlQuery(newUrl);
          onChange(nextImg);
          setEnhanceByIndex((prev) => {
            const copy = [...prev];
            const cur = copy[index];
            copy[index] = {
              originalUrl: typeof o === "string" ? stripUrlQuery(o) : cur?.originalUrl ?? stripUrlQuery(images[index]),
              fullUrl: stripUrlQuery(f),
              thumbUrl: typeof thumb === "string" ? stripUrlQuery(thumb) : cur?.thumbUrl ?? "",
              previewUrl: typeof preview === "string" ? stripUrlQuery(preview) : cur?.previewUrl ?? "",
              useOptimized: cur?.useOptimized ?? true,
              cacheBust: Date.now(),
            };
            return copy;
          });
        }
      } finally {
        setAutoImproveIdx(null);
      }
    },
    [images, listingId, onChange, enhanceAligned],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    void (async () => {
      const nextCap = maxImages - images.length;
      const list = Array.from(files).slice(0, Math.max(0, nextCap));
      for (const f of list) {
        await uploadOne(f);
      }
      e.target.value = "";
    })();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (blocked || uploading) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => {
      const t = (f.type || "").toLowerCase();
      const name = f.name || "";
      const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : undefined;
      return (
        t.startsWith("image/") ||
        ext === "jpg" ||
        ext === "jpeg" ||
        ext === "png" ||
        ext === "webp" ||
        ext === "heic" ||
        ext === "heif"
      );
    });
    const nextCap = maxImages - images.length;
    const list = files.slice(0, Math.max(0, nextCap));
    void (async () => {
      for (const f of list) {
        await uploadOne(f);
      }
    })();
  };

  const removeAt = (index: number) => {
    const nextUrls = images.filter((_, i) => i !== index);
    onChange(nextUrls);
    setEnhanceByIndex((prev) => prev.filter((_, i) => i !== index));
    setQualityByIndex((prev) => prev.filter((_, i) => i !== index));
    setPhotoTypesSafely(nextUrls);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setEnhanceByIndex((prev) => {
      const copy = [...prev];
      const [em] = copy.splice(from, 1);
      copy.splice(to, 0, em ?? null);
      return copy;
    });
    setQualityByIndex((prev) => {
      const copy = [...prev];
      const [qm] = copy.splice(from, 1);
      copy.splice(to, 0, qm ?? null);
      return copy;
    });
    if (onPhotoTypesChange && Array.isArray(photoTypes)) {
      const nextTypes = [...photoTypes];
      const [t] = nextTypes.splice(from, 1);
      nextTypes.splice(to, 0, t ?? (to === 0 ? "EXTERIOR" : "OTHER"));
      if (nextTypes.length > 0) nextTypes[0] = "EXTERIOR";
      onPhotoTypesChange(nextTypes.slice(0, maxImages));
    }
  };

  const imgSrcForIndex = (i: number): string => {
    const meta = enhanceAligned[i];
    const fallback = images[i];
    if (!meta?.fullUrl || !meta.originalUrl) return fallback;
    if (meta.useOptimized) {
      const q = typeof meta.cacheBust === "number" ? `?v=${meta.cacheBust}` : "";
      return `${stripUrlQuery(meta.fullUrl)}${q}`;
    }
    return stripUrlQuery(meta.originalUrl);
  };

  const toggleUseOptimizedAt = (i: number) => {
    const meta = enhanceAligned[i];
    if (!meta?.fullUrl || !meta.originalUrl || disabled) return;
    const nextVal = !meta.useOptimized;
    setEnhanceByIndex((prev) => {
      const c = [...prev];
      const m = c[i];
      if (!m) return prev;
      c[i] = { ...m, useOptimized: nextVal };
      return c;
    });
    const nextUrls = [...images];
    nextUrls[i] = nextVal ? stripUrlQuery(meta.fullUrl) : stripUrlQuery(meta.originalUrl);
    onChange(nextUrls);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#B3B3B3]">
            Photos{" "}
            <span className={galleryFull ? "font-semibold text-premium-gold" : "text-white"}>
              {images.length}/{maxImages}
            </span>
            {galleryFull ? (
              <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-premium-gold/90">
                Full
              </span>
            ) : null}
          </p>
          {/* Upload progress line — one segment per slot */}
          <div
            className="mt-2 flex gap-1.5"
            role="progressbar"
            aria-valuenow={images.length}
            aria-valuemin={0}
            aria-valuemax={maxImages}
            aria-label={`${images.length} of ${maxImages} photo slots used`}
          >
            {Array.from({ length: maxImages }).map((_, i) => (
              <div
                key={`slot-${i}`}
                className={[
                  "h-1.5 min-w-[12px] flex-1 rounded-full transition-colors",
                  i < images.length ? "bg-premium-gold shadow-[0_0_8px_rgba(212,175,55,0.35)]" : "bg-white/[0.12]",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
        {listingId ? null : (
          <p className="text-xs font-medium text-amber-200/90">
            Save draft once to enable uploads — we store files under your listing folder.
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!blocked && !uploading) inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!blocked) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!blocked) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => {
          if (!blocked && !uploading) inputRef.current?.click();
        }}
        className={[
          "relative cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
          "bg-[#0B0B0B]",
          dragOver && !blocked ? "border-premium-gold bg-[#141414]" : "border-white/20",
          !blocked ? "hover:border-premium-gold hover:bg-[#111]" : "cursor-not-allowed opacity-60",
        ].join(" ")}
        style={
          {
            "--gold": GOLD,
          } as React.CSSProperties
        }
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={acceptAttribute()}
          multiple
          className="sr-only"
          disabled={blocked || uploading}
          onChange={onInputChange}
        />
        <p className="text-sm font-medium text-[#E8E8E8]">
          {uploading
            ? "Uploading…"
            : galleryFull
              ? "Gallery full — remove a photo below to add another"
              : "Drop photos here or click to browse"}
        </p>
        <p className="mt-2 text-xs text-[#888]">
          JPG, PNG, WebP · up to 10MB each · max {maxImages} images
          {galleryFull ? (
            <span className="block pt-1 text-premium-gold/90">You are using all {maxImages} slots.</span>
          ) : null}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">
          First photo must be an <span className="text-white/90">exterior</span> with a visible{" "}
          <span className="text-white/90">street or building number</span> (facade, door, mailbox, or entrance plaque).
          Other slots: rooms, yard, amenities. Non-property images may be rejected.
        </p>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {pendingReject ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-50">
          <p className="font-medium text-amber-100">Quality check blocked this upload.</p>
          <p className="mt-1 text-[11px] text-amber-100/85">
            You can upload anyway if this is the best shot you have — we still keep your original file for future
            processing.
          </p>
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => void uploadOne(pendingReject.file, { qualityOverride: true })}
            className="mt-2 rounded-md bg-amber-600/90 px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-amber-500 disabled:opacity-40"
          >
            Upload anyway (override)
          </button>
        </div>
      ) : null}

      {/* Thumbnails */}
      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((src, i) => {
            const q = qualityAligned[i];
            const enhanceMeta = enhanceAligned[i];
            const safeMeta =
              enhanceMeta?.fullUrl && enhanceMeta?.originalUrl
                ? enhanceMeta
                : null;
            const showCompare = Boolean(safeMeta);
            const previewOpt =
              safeMeta &&
              `${stripUrlQuery(safeMeta.fullUrl)}${typeof safeMeta.cacheBust === "number" ? `?v=${safeMeta.cacheBust}` : ""}`;
            return (
            <li
              key={`${src}-${i}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a]"
            >
              <div className="relative aspect-square w-full shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrcForIndex(i)} alt="" className="h-full w-full object-cover" />
                {q ? (
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${qualityTierBadgeClass(q.tier)}`}
                  >
                    Quality {q.score}
                  </span>
                ) : null}
                {i === 0 ? (
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold">
                    Cover: exterior + number
                  </span>
                ) : null}
                {onPhotoTypesChange ? (
                  <div className="absolute left-2 right-2 top-2 z-10">
                    {i === 0 ? null : (
                      <select
                        disabled={disabled}
                        value={(photoTypes?.[i] ?? "OTHER") as FsboPhotoType}
                        onChange={(e) => {
                          const v = e.target.value as FsboPhotoType;
                          const next = Array.isArray(photoTypes) ? [...photoTypes] : [];
                          // Ensure length up to this index.
                          while (next.length <= i) {
                            next.push(next.length === 0 ? "EXTERIOR" : "OTHER");
                          }
                          next[i] = v;
                          next[0] = "EXTERIOR";
                          onPhotoTypesChange(next.slice(0, maxImages));
                        }}
                        className="w-full rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white"
                      >
                        {FSBO_PHOTO_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t === "EXTERIOR"
                              ? "Exterior"
                              : t === "INTERIOR"
                                ? "Interior"
                                : t === "STREET_VIEW"
                                  ? "Street view"
                                  : "Other"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100 sm:opacity-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={disabled || i === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, i - 1);
                      }}
                      className="rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20 disabled:opacity-30"
                      aria-label="Move earlier"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={disabled || i === images.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, i + 1);
                      }}
                      className="rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20 disabled:opacity-30"
                      aria-label="Move later"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAt(i);
                    }}
                    className="rounded bg-red-900/80 px-2 py-1 text-[10px] font-medium text-red-100 hover:bg-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {listingId ? (
                <div className="space-y-2 border-t border-white/10 bg-black/35 p-2">
                  {coverRankBusy ? (
                    <p className="text-[10px] text-[#888]">Ranking photos for cover…</p>
                  ) : null}
                  {recommendedCoverIndex !== null &&
                  recommendedCoverIndex >= 0 &&
                  recommendedCoverIndex === i ? (
                    <p className="text-[10px] font-medium text-premium-gold">⭐ Recommended cover</p>
                  ) : null}
                  {showCompare && safeMeta ? (
                    <>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#888]">Before / after</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="mb-1 text-[10px] text-[#AAA]">Original</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stripUrlQuery(safeMeta.originalUrl)}
                            alt=""
                            className="h-14 w-full rounded object-cover ring-1 ring-white/15"
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] text-[#AAA]">Optimized</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewOpt ?? ""}
                            alt=""
                            className="h-14 w-full rounded object-cover ring-1 ring-premium-gold/40"
                          />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#CCC]">
                        <input
                          type="checkbox"
                          className="rounded border-white/30 bg-black/50 text-premium-gold focus:ring-premium-gold"
                          checked={safeMeta.useOptimized}
                          disabled={disabled}
                          onChange={() => toggleUseOptimizedAt(i)}
                        />
                        Use optimized image
                      </label>
                    </>
                  ) : (
                    <p className="text-[10px] leading-snug text-[#888]">
                      Optimization compares appear after upload or &quot;Improve&quot; on bundled photos.
                    </p>
                  )}
                  {q?.tier === "warn" ? (
                    <ul className="space-y-0.5 text-[10px] leading-snug text-amber-100/90">
                      {humanizeQualityIssues(q.issues).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={disabled || improveIdx === i || autoImproveIdx === i}
                      onClick={(e) => {
                        e.stopPropagation();
                        void improvePhotoAt(i);
                      }}
                      className="w-full rounded-lg bg-white/[0.08] px-2 py-1.5 text-[11px] font-medium text-premium-gold hover:bg-white/[0.12] disabled:opacity-40"
                    >
                      {improveIdx === i ? "Improving…" : "✨ Improve Photo"}
                    </button>
                    <button
                      type="button"
                      disabled={disabled || improveIdx === i || autoImproveIdx === i}
                      onClick={(e) => {
                        e.stopPropagation();
                        void autoImprovePhotoAt(i);
                      }}
                      className="w-full rounded-lg border border-premium-gold/35 bg-premium-gold/10 px-2 py-1.5 text-[11px] font-medium text-premium-gold hover:bg-premium-gold/15 disabled:opacity-40"
                    >
                      {autoImproveIdx === i ? "Working…" : "✨ Auto Improve"}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
