import type { FsboListingOwnerType, Prisma } from "@prisma/client";
import { FSBO_MAX_LISTING_IMAGES } from "@/lib/fsbo/media-config";
import {
  FSBO_PLAN_BASIC,
  FSBO_PLAN_PREMIUM,
  type FsboPublishPlan,
} from "@/lib/fsbo/constants";

const MAX_TITLE = 200;
const MAX_DESC = 50_000;
const MAX_ADDR = 500;
const MAX_CITY = 120;
const MAX_CONTACT = 320;
const MAX_MSG = 8_000;

export type FsboListingInput = {
  title: string;
  description: string;
  priceCents: number;
  address: string;
  city: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surfaceSqft?: number | null;
  images: string[];
  /** Only meaningful while listing is DRAFT; API ignores changes after publish. */
  publishPlan: FsboPublishPlan;
  contactEmail: string;
  contactPhone?: string | null;
};

function trimStr(s: string, max: number): string {
  return s.trim().slice(0, max);
}

export function parseFsboListingBody(body: unknown):
  | { ok: true; data: FsboListingInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON" };
  const o = body as Record<string, unknown>;

  const title = typeof o.title === "string" ? trimStr(o.title, MAX_TITLE) : "";
  const description = typeof o.description === "string" ? trimStr(o.description, MAX_DESC) : "";
  const address = typeof o.address === "string" ? trimStr(o.address, MAX_ADDR) : "";
  const city = typeof o.city === "string" ? trimStr(o.city, MAX_CITY) : "";
  const contactEmail =
    typeof o.contactEmail === "string" ? trimStr(o.contactEmail, MAX_CONTACT) : "";
  const contactPhone =
    typeof o.contactPhone === "string" && o.contactPhone.trim()
      ? trimStr(String(o.contactPhone), MAX_CONTACT)
      : null;

  let priceCents: number;
  if (typeof o.priceCents === "number" && Number.isFinite(o.priceCents)) {
    priceCents = Math.round(o.priceCents);
  } else if (typeof o.price === "number" && Number.isFinite(o.price)) {
    priceCents = Math.round(o.price * 100);
  } else if (typeof o.price === "string" && o.price.trim()) {
    const n = Number.parseFloat(o.price.replace(/[^0-9.]/g, ""));
    priceCents = Number.isFinite(n) ? Math.round(n * 100) : NaN;
  } else {
    priceCents = NaN;
  }

  const bedrooms =
    o.bedrooms == null || o.bedrooms === ""
      ? null
      : typeof o.bedrooms === "number"
        ? Math.min(99, Math.max(0, Math.round(o.bedrooms)))
        : parseInt(String(o.bedrooms), 10);
  const bathrooms =
    o.bathrooms == null || o.bathrooms === ""
      ? null
      : typeof o.bathrooms === "number"
        ? Math.min(99, Math.max(0, Math.round(o.bathrooms)))
        : parseInt(String(o.bathrooms), 10);

  const surfaceSqft =
    o.surfaceSqft == null || o.surfaceSqft === ""
      ? null
      : typeof o.surfaceSqft === "number"
        ? Math.min(999_999_999, Math.max(0, Math.round(o.surfaceSqft)))
        : parseInt(String(o.surfaceSqft), 10);

  let publishPlan: FsboPublishPlan = FSBO_PLAN_BASIC;
  const rawPlan = o.publishPlan;
  if (rawPlan === FSBO_PLAN_PREMIUM || rawPlan === "premium") publishPlan = FSBO_PLAN_PREMIUM;
  else if (rawPlan === FSBO_PLAN_BASIC || rawPlan === "basic") publishPlan = FSBO_PLAN_BASIC;

  let images: string[] = [];
  if (Array.isArray(o.images)) {
    images = o.images
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim().slice(0, 2048))
      .slice(0, FSBO_MAX_LISTING_IMAGES);
  } else if (typeof o.imagesRaw === "string" && o.imagesRaw.trim()) {
    images = o.imagesRaw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, FSBO_MAX_LISTING_IMAGES);
  }

  if (!title) return { ok: false, error: "Title is required" };
  if (!description) return { ok: false, error: "Description is required" };
  if (!Number.isFinite(priceCents) || priceCents < 1_000) return { ok: false, error: "Valid price required (min $10)" };
  if (!address) return { ok: false, error: "Address is required" };
  if (!city) return { ok: false, error: "City is required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { ok: false, error: "Valid contact email required" };

  const bd =
    bedrooms != null && Number.isFinite(bedrooms) ? Math.round(bedrooms as number) : null;
  const bt =
    bathrooms != null && Number.isFinite(bathrooms) ? Math.round(bathrooms as number) : null;
  const sf =
    surfaceSqft != null && Number.isFinite(surfaceSqft) ? Math.round(surfaceSqft as number) : null;

  return {
    ok: true,
    data: {
      title,
      description,
      priceCents,
      address,
      city,
      bedrooms: bd,
      bathrooms: bt,
      surfaceSqft: sf,
      images,
      publishPlan,
      contactEmail,
      contactPhone,
    },
  };
}

export function parseFsboContactBody(body: unknown):
  | { ok: true; data: { listingId: string; name: string; email: string; phone: string | null; message: string | null } }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON" };
  const o = body as Record<string, unknown>;
  const listingId = typeof o.listingId === "string" ? o.listingId.trim() : "";
  const name = typeof o.name === "string" ? trimStr(o.name, 200) : "";
  const email = typeof o.email === "string" ? trimStr(o.email, MAX_CONTACT) : "";
  const phone =
    typeof o.phone === "string" && o.phone.trim() ? trimStr(String(o.phone), 40) : null;
  const message =
    typeof o.message === "string" && o.message.trim()
      ? trimStr(o.message, MAX_MSG)
      : null;

  if (!listingId) return { ok: false, error: "listingId required" };
  if (!name) return { ok: false, error: "Name required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Valid email required" };

  return { ok: true, data: { listingId, name, email, phone, message } };
}

export function toFsboCreateData(
  ownerId: string,
  input: FsboListingInput,
  opts?: { tenantId?: string | null; listingOwnerType?: FsboListingOwnerType; listingCode?: string }
): Prisma.FsboListingCreateInput {
  const coverImage = input.images[0] ?? null;
  return {
    owner: { connect: { id: ownerId } },
    ...(opts?.tenantId ? { tenant: { connect: { id: opts.tenantId } } } : {}),
    ...(opts?.listingCode ? { listingCode: opts.listingCode } : {}),
    listingOwnerType: opts?.listingOwnerType ?? "SELLER",
    title: input.title,
    description: input.description,
    priceCents: input.priceCents,
    address: input.address,
    city: input.city,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    surfaceSqft: input.surfaceSqft ?? null,
    images: input.images,
    coverImage,
    status: "DRAFT",
    moderationStatus: "APPROVED",
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone ?? null,
    publishPlan: input.publishPlan,
  };
}

export function toFsboUpdateData(
  input: FsboListingInput
): Prisma.FsboListingUpdateInput {
  const coverImage = input.images[0] ?? null;
  return {
    title: input.title,
    description: input.description,
    priceCents: input.priceCents,
    address: input.address,
    city: input.city,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    surfaceSqft: input.surfaceSqft ?? null,
    images: input.images,
    coverImage,
    publishPlan: input.publishPlan,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone ?? null,
  };
}
