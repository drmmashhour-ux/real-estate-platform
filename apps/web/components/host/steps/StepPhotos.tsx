"use client";

import { useListingWizard } from "@/stores/useListingWizard";

export function StepPhotos() {
  const previewUrls = useListingWizard((s) => s.previewUrls);
  const setPhotosFromFileList = useListingWizard((s) => s.setPhotosFromFileList);
  const removePhotoAt = useListingWizard((s) => s.removePhotoAt);
  const movePhoto = useListingWizard((s) => s.movePhoto);
  const nextStep = useListingWizard((s) => s.nextStep);
  const prevStep = useListingWizard((s) => s.prevStep);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Add photos now (optional). The first photo becomes your cover. You can upload more later.
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/30 px-6 py-10 transition hover:border-emerald-400/50">
        <span className="text-lg font-medium text-white">Tap to add photos</span>
        <span className="mt-1 text-sm text-slate-500">PNG, JPG — up to 24</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            const fl = e.target.files;
            if (fl?.length) setPhotosFromFileList(fl);
            e.target.value = "";
          }}
        />
      </label>

      {previewUrls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previewUrls.map((url, i) => (
            <li key={url} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob previews */}
              <img src={url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                  Cover
                </span>
              ) : null}
              <div className="flex gap-1 border-t border-white/10 p-1">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-white/10 py-2 text-xs text-white disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => movePhoto(i, i - 1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-white/10 py-2 text-xs text-white disabled:opacity-30"
                  disabled={i >= previewUrls.length - 1}
                  onClick={() => movePhoto(i, i + 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-rose-500/30 px-2 text-xs text-rose-100"
                  onClick={() => removePhotoAt(i)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => prevStep()}
          className="flex-1 rounded-2xl border border-white/20 py-4 text-lg font-medium text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => nextStep()}
          className="flex-1 rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-slate-950"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
