import { z } from "zod";

const listingTypeEnum = z.enum(["HOUSE", "CONDO", "MULTI_UNIT", "TOWNHOUSE", "LAND", "OTHER"]);

/** POST /api/broker/listings — CRM listing create payload (extras ignored). */
export const brokerCrmListingCreateSchema = z.object({
  title: z.union([z.string(), z.undefined()]).optional(),
  price: z.union([z.number(), z.string(), z.undefined()]).optional(),
  listingType: z.union([listingTypeEnum, z.string(), z.undefined()]).optional(),
  type: z.union([listingTypeEnum, z.string(), z.undefined()]).optional(),
  isCoOwnership: z.boolean().optional(),
});

export type BrokerCrmListingCreateInput = z.infer<typeof brokerCrmListingCreateSchema>;

export function safeParseBrokerCrmListingBody(raw: unknown): {
  ok: true;
  title?: string;
  price?: number;
  listingType?: z.infer<typeof listingTypeEnum>;
  isCoOwnership?: boolean;
} | {
  ok: false;
  error: string;
} {
  const parsed = brokerCrmListingCreateSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    const first = Object.entries(msg)[0]?.[1]?.[0];
    return { ok: false, error: first ?? "Invalid listing payload" };
  }
  const d = parsed.data;
  let priceNum: number | undefined;
  if (d.price !== undefined) {
    const n = typeof d.price === "number" ? d.price : Number(d.price);
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: "price must be a non-negative number" };
    priceNum = n;
  }
  const ltRaw = d.listingType ?? d.type;
  let listingType: z.infer<typeof listingTypeEnum> | undefined;
  if (typeof ltRaw === "string") {
    const u = ltRaw.trim().toUpperCase();
    const inner = listingTypeEnum.safeParse(u);
    if (!inner.success) return { ok: false, error: "listingType must be a valid asset type" };
    listingType = inner.data;
  }
  const title = typeof d.title === "string" ? d.title.slice(0, 800) : undefined;

  return {
    ok: true,
    ...(title !== undefined ? { title } : {}),
    ...(priceNum !== undefined ? { price: priceNum } : {}),
    ...(listingType !== undefined ? { listingType } : {}),
    ...(typeof d.isCoOwnership === "boolean" ? { isCoOwnership: d.isCoOwnership } : {}),
  };
}
