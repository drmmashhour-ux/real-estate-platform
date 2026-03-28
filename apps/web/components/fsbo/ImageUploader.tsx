"use client";

import { useCallback, useId, useRef, useState } from "react";
import {
  FSBO_ALLOWED_IMAGE_MIME,
  FSBO_MAX_IMAGE_BYTES,
  FSBO_MAX_LISTING_IMAGES,
} from "@/lib/fsbo/media-config";
import type { FsboPhotoType } from "@/lib/fsbo/photo-limits";
import { FSBO_PHOTO_TYPES } from "@/lib/fsbo/photo-limits";

type Props = {
  listingId: string | null;
  images: string[];
  onChange: (urls: string[]) => void;
  photoTypes?: FsboPhotoType[];
  onPhotoTypesChange?: (types: FsboPhotoType[]) => void;
  disabled?: boolean;
  /** Defaults to FSBO_MAX_LISTING_IMAGES from media-config */
  maxImages?: number;
};

const GOLD = "var(--color-premium-gold)";

function acceptAttribute(): string {
  // Keep client-side accept aligned with server-side support.
  // HEIC/HEIF are converted to JPG on the server.
  return [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].join(",");
}

export function ImageUploader({
  listingId,
  images,
  onChange,
  photoTypes,
  onPhotoTypesChange,
  disabled = false,
  maxImages = FSBO_MAX_LISTING_IMAGES,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = images.length < maxImages;
  const blocked = disabled || !listingId || !canAdd;

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
      return "Each image must be 5MB or smaller.";
    }
    return null;
  };

  const setPhotoTypesSafely = (nextUrls: string[]) => {
    if (!onPhotoTypesChange) return;
    const current = Array.isArray(photoTypes) ? photoTypes : [];
    const next: FsboPhotoType[] = [];
    for (let i = 0; i < nextUrls.length; i++) {
      const fallback: FsboPhotoType = i === 0 ? "EXTERIOR" : "OTHER";
      next[i] = (current[i] ?? fallback) as FsboPhotoType;
    }
    if (next.length > 0) next[0] = "EXTERIOR"; // first photo required
    onPhotoTypesChange(next);
  };

  const uploadOne = useCallback(
    async (file: File) => {
      if (!listingId) return;
      const v = validateFile(file);
      if (v) {
        setError(v);
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Upload failed");
          return;
        }
        const url = typeof data.url === "string" ? data.url : "";
        if (!url) {
          setError("Invalid server response");
          return;
        }
        const nextUrls = [...images, url].slice(0, maxImages);
        onChange(nextUrls);
        setPhotoTypesSafely(nextUrls);
      } finally {
        setUploading(false);
      }
    },
    [images, listingId, maxImages, onChange, photoTypes, onPhotoTypesChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    void (async () => {
      const nextCap = maxImages - images.length;
      const list = Array.from(files).slice(0, Math.max(0, nextCap));
      for (const f of list) {
        // eslint-disable-next-line no-await-in-loop
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
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(f);
      }
    })();
  };

  const removeAt = (index: number) => {
    const nextUrls = images.filter((_, i) => i !== index);
    onChange(nextUrls);
    setPhotoTypesSafely(nextUrls);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    if (onPhotoTypesChange && Array.isArray(photoTypes)) {
      const nextTypes = [...photoTypes];
      const [t] = nextTypes.splice(from, 1);
      nextTypes.splice(to, 0, t ?? (to === 0 ? "EXTERIOR" : "OTHER"));
      if (nextTypes.length > 0) nextTypes[0] = "EXTERIOR";
      onPhotoTypesChange(nextTypes.slice(0, maxImages));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#B3B3B3]">
          Photos{" "}
          <span className="text-white">
            {images.length}/{maxImages}
          </span>
        </p>
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
          {uploading ? "Uploading…" : "Drop photos here or click to browse"}
        </p>
        <p className="mt-2 text-xs text-[#888]">JPG, PNG, WebP · up to 5MB each · max {maxImages} images</p>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {/* Thumbnails */}
      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold">
                  Exterior (required)
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
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
