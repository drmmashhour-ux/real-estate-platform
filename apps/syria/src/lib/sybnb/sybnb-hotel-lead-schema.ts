import { z } from "zod";

/** ORDER SYBNB-52 — must match `SybnbHotelLeadStatus` in Prisma. */
export const SYBNB_HOTEL_LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "onboarded",
  "active",
  "paying",
  "lost",
] as const;

export type SybnbHotelLeadStatusValue = (typeof SYBNB_HOTEL_LEAD_STATUSES)[number];

export const sybnbHotelLeadStatusSchema = z.enum(SYBNB_HOTEL_LEAD_STATUSES);

export const sybnbHotelLeadCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(40),
  city: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(8000).optional(),
  status: sybnbHotelLeadStatusSchema.optional(),
});

export const sybnbHotelLeadPatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().min(5).max(40).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  notes: z.union([z.string().trim().max(8000), z.literal("")]).optional(),
  status: sybnbHotelLeadStatusSchema.optional(),
});
