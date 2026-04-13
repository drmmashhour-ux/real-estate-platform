"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "lecipm-host-new-listing-wizard-v1";

export const AMENITY_KEYS = ["wifi", "kitchen", "parking", "tv", "ac"] as const;
export type AmenityKey = (typeof AMENITY_KEYS)[number];

const LABEL_TO_AMENITY: Record<AmenityKey, string> = {
  wifi: "WiFi",
  kitchen: "Kitchen",
  parking: "Parking",
  tv: "TV",
  ac: "AC",
};

/** Response shape from GET `/api/host/listings/[id]/template` — used to prefill a new listing */
export type HostListingTemplateSnapshot = {
  title: string;
  address: string;
  city: string;
  description: string;
  propertyType: string;
  roomType: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  price: number;
  amenities: string[];
};

export type HostNewListingPersisted = {
  step: number;
  draftListingId: string | null;
  title: string;
  city: string;
  address: string;
  propertyType: string;
  /** Booking / hosting room filter — same options as BNHUB create listing */
  roomType: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  price: number;
  description: string;
  amenities: Record<AmenityKey, boolean>;
};

const initialAmenities: Record<AmenityKey, boolean> = {
  wifi: false,
  kitchen: false,
  parking: false,
  tv: false,
  ac: false,
};

const initialPersisted: HostNewListingPersisted = {
  step: 1,
  draftListingId: null,
  title: "",
  city: "",
  address: "",
  propertyType: "Apartment",
  roomType: "Entire place",
  maxGuests: 4,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  price: 139,
  description: "",
  amenities: { ...initialAmenities },
};

function revokeAll(urls: string[]) {
  for (const u of urls) {
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* ignore */
    }
  }
}

export type HostNewListingStore = HostNewListingPersisted & {
  photos: File[];
  previewUrls: string[];
  saveError: string | null;
  busy: boolean;
  setStep: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  update: <K extends keyof HostNewListingPersisted>(key: K, value: HostNewListingPersisted[K]) => void;
  toggleAmenity: (key: AmenityKey) => void;
  setPhotosFromFileList: (list: FileList | File[]) => void;
  clearAllPhotos: () => void;
  removePhotoAt: (i: number) => void;
  /** Create / update draft on server, upload photos when leaving step 3, then advance. */
  saveAndGoNext: () => Promise<void>;
  reset: () => void;
  /** Replace wizard state from another listing (new draft); clears photos and step 1. */
  applyTemplateSnapshot: (data: HostListingTemplateSnapshot) => void;
};

function amenitiesToList(m: Record<AmenityKey, boolean>): string[] {
  return AMENITY_KEYS.filter((k) => m[k]).map((k) => LABEL_TO_AMENITY[k]);
}

/** Map stored amenity labels (from DB / template API) onto wizard toggles */
export function amenityLabelsToRecord(labels: string[]): Record<AmenityKey, boolean> {
  const lower = labels.map((l) => l.toLowerCase());
  const next: Record<AmenityKey, boolean> = { ...initialAmenities };
  for (const key of AMENITY_KEYS) {
    const label = LABEL_TO_AMENITY[key].toLowerCase();
    if (lower.some((l) => l === label || l.includes(label) || label.includes(l))) {
      next[key] = true;
    }
  }
  return next;
}

export const useHostNewListingWizard = create<HostNewListingStore>()(
  persist(
    (set, get) => ({
      ...initialPersisted,
      photos: [],
      previewUrls: [],
      saveError: null,
      busy: false,

      setStep: (n) => set({ step: Math.min(7, Math.max(1, n)) }),

      nextStep: () => set((s) => ({ step: Math.min(7, s.step + 1) })),

      prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) })),

      update: (key, value) => set({ [key]: value } as Partial<HostNewListingStore>),

      toggleAmenity: (key) =>
        set((s) => ({
          amenities: { ...s.amenities, [key]: !s.amenities[key] },
        })),

      setPhotosFromFileList: (list) => {
        const incoming = Array.from(list instanceof FileList ? list : list).filter((f) =>
          f.type.startsWith("image/")
        );
        const existingPhotos = get().photos;
        const existingUrls = get().previewUrls;
        const room = Math.max(0, 20 - existingPhotos.length);
        if (room === 0 || incoming.length === 0) return;
        const add = incoming.slice(0, room);
        const newUrls = add.map((f) => URL.createObjectURL(f));
        set({
          photos: [...existingPhotos, ...add],
          previewUrls: [...existingUrls, ...newUrls],
        });
      },

      clearAllPhotos: () => {
        revokeAll(get().previewUrls);
        set({ photos: [], previewUrls: [] });
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

      saveAndGoNext: async () => {
        const s = get();
        set({ saveError: null, busy: true });
        try {
          if (s.step === 1) {
            if (!s.title.trim() || !s.city.trim()) {
              throw new Error("Add a name and city to continue.");
            }
            if (!s.draftListingId) {
              const r = await fetch("/api/host/listings/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: s.title.trim(),
                  city: s.city.trim(),
                  address: s.address.trim() || undefined,
                  propertyType: s.propertyType,
                  roomType: s.roomType,
                  maxGuests: s.maxGuests,
                  bedrooms: s.bedrooms,
                  beds: s.beds,
                  baths: s.baths,
                }),
              });
              const j = (await r.json()) as { id?: string; error?: string };
              if (!r.ok || !j.id) throw new Error(j.error ?? "Something went wrong — try again.");
              set({ draftListingId: j.id });
            } else {
              const r = await fetch(`/api/host/listings/${s.draftListingId}/wizard`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: s.title.trim(),
                  city: s.city.trim(),
                  address: s.address.trim() || undefined,
                  propertyType: s.propertyType,
                  roomType: s.roomType,
                  maxGuests: s.maxGuests,
                  bedrooms: s.bedrooms,
                  beds: s.beds,
                  baths: s.baths,
                }),
              });
              const j = (await r.json()) as { error?: string };
              if (!r.ok) throw new Error(j.error ?? "Something went wrong — try again.");
            }
          }

          const id = get().draftListingId;
          if (!id) throw new Error("We couldn’t find your draft — go back to step 1.");

          if (s.step === 2) {
            const r = await fetch(`/api/host/listings/${id}/wizard`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                maxGuests: s.maxGuests,
                bedrooms: s.bedrooms,
                beds: s.beds,
                baths: s.baths,
              }),
            });
            const j = (await r.json()) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? "Something went wrong — try again.");
          }

          if (s.step === 3) {
            for (const file of s.photos) {
              const fd = new FormData();
              fd.append("file", file);
              const up = await fetch(`/api/host/listings/${id}/photos`, { method: "POST", body: fd });
              if (!up.ok) {
                const uj = (await up.json().catch(() => ({}))) as { error?: string };
                throw new Error(uj.error ?? "Photos didn’t upload — try again.");
              }
            }
          }

          if (s.step === 4) {
            const r = await fetch(`/api/host/listings/${id}/wizard`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amenities: amenitiesToList(s.amenities) }),
            });
            const j = (await r.json()) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? "Something went wrong — try again.");
          }

          if (s.step === 5) {
            const price = s.price;
            const r = await fetch(`/api/host/listings/${id}/wizard`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pricePerNight: price }),
            });
            const j = (await r.json()) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? "Something went wrong — try again.");
            set({ price });
          }

          if (s.step === 6) {
            const r = await fetch(`/api/host/listings/${id}/wizard`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description: s.description }),
            });
            const j = (await r.json()) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? "Something went wrong — try again.");
          }

          set((state) => ({ step: Math.min(7, state.step + 1) }));
        } catch (e) {
          set({
            saveError: e instanceof Error ? e.message : "Something went wrong — try again.",
          });
        } finally {
          set({ busy: false });
        }
      },

      reset: () => {
        revokeAll(get().previewUrls);
        set({
          ...initialPersisted,
          amenities: { ...initialAmenities },
          photos: [],
          previewUrls: [],
          saveError: null,
          busy: false,
        });
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },

      applyTemplateSnapshot: (data: HostListingTemplateSnapshot) => {
        revokeAll(get().previewUrls);
        const amenities = amenityLabelsToRecord(data.amenities);
        set({
          ...initialPersisted,
          step: 1,
          draftListingId: null,
          title: data.title,
          address: data.address,
          city: data.city,
          description: data.description,
          propertyType: data.propertyType,
          roomType: data.roomType,
          maxGuests: data.maxGuests,
          bedrooms: data.bedrooms,
          beds: data.beds,
          baths: data.baths,
          price: data.price,
          amenities,
          photos: [],
          previewUrls: [],
          saveError: null,
          busy: false,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): HostNewListingPersisted => ({
        step: s.step,
        draftListingId: s.draftListingId,
        title: s.title,
        city: s.city,
        address: s.address,
        propertyType: s.propertyType,
        roomType: s.roomType,
        maxGuests: s.maxGuests,
        bedrooms: s.bedrooms,
        beds: s.beds,
        baths: s.baths,
        price: s.price,
        description: s.description,
        amenities: s.amenities,
      }),
      merge: (p, c) => {
        const persisted = p as HostNewListingPersisted | undefined;
        return {
          ...c,
          ...persisted,
          roomType: persisted?.roomType ?? "Entire place",
          photos: [],
          previewUrls: [],
          saveError: null,
          busy: false,
          amenities: {
            ...initialAmenities,
            ...(persisted?.amenities ?? {}),
          },
        };
      },
    }
  )
);
