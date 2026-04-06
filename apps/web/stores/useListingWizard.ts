"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const WIZARD_STORAGE_KEY = "lecipm-listing-wizard-v1";

export type ListingWizardPersisted = {
  step: number;
  title: string;
  city: string;
  price: number;
  description: string;
  amenities: string[];
};

const initialPersisted: ListingWizardPersisted = {
  step: 1,
  title: "",
  city: "",
  price: 139,
  description: "",
  amenities: [],
};

function revokePreviewUrls(urls: string[]) {
  for (const u of urls) {
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* ignore */
    }
  }
}

export type ListingWizardStore = ListingWizardPersisted & {
  photos: File[];
  previewUrls: string[];
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateField: <K extends keyof ListingWizardPersisted>(key: K, value: ListingWizardPersisted[K]) => void;
  setPhotosFromFileList: (files: FileList | File[]) => void;
  removePhotoAt: (index: number) => void;
  movePhoto: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
};

export const useListingWizard = create<ListingWizardStore>()(
  persist(
    (set, get) => ({
      ...initialPersisted,
      photos: [],
      previewUrls: [],

      setStep: (step) => set({ step: Math.min(5, Math.max(1, step)) }),

      nextStep: () => set((s) => ({ step: Math.min(5, s.step + 1) })),

      prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) })),

      updateField: (key, value) => set({ [key]: value } as Partial<ListingWizardStore>),

      setPhotosFromFileList: (list) => {
        const files = Array.from(list instanceof FileList ? list : list).filter((f) =>
          f.type.startsWith("image/")
        );
        const capped = files.slice(0, 24);
        const prev = get().previewUrls;
        revokePreviewUrls(prev);
        const previewUrls = capped.map((f) => URL.createObjectURL(f));
        set({ photos: capped, previewUrls });
      },

      removePhotoAt: (index) => {
        const photos = [...get().photos];
        const previewUrls = [...get().previewUrls];
        if (index < 0 || index >= photos.length) return;
        try {
          URL.revokeObjectURL(previewUrls[index]!);
        } catch {
          /* ignore */
        }
        photos.splice(index, 1);
        previewUrls.splice(index, 1);
        set({ photos, previewUrls });
      },

      movePhoto: (fromIndex, toIndex) => {
        const photos = [...get().photos];
        const previewUrls = [...get().previewUrls];
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= photos.length ||
          toIndex >= photos.length
        ) {
          return;
        }
        const [fp] = photos.splice(fromIndex, 1);
        const [fu] = previewUrls.splice(fromIndex, 1);
        photos.splice(toIndex, 0, fp!);
        previewUrls.splice(toIndex, 0, fu!);
        set({ photos, previewUrls });
      },

      reset: () => {
        revokePreviewUrls(get().previewUrls);
        set({
          ...initialPersisted,
          photos: [],
          previewUrls: [],
        });
        try {
          localStorage.removeItem(WIZARD_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: WIZARD_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): ListingWizardPersisted => ({
        step: s.step,
        title: s.title,
        city: s.city,
        price: s.price,
        description: s.description,
        amenities: s.amenities,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as ListingWizardPersisted),
        photos: [],
        previewUrls: [],
      }),
    }
  )
);
