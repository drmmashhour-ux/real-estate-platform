import { z } from "zod";

const listingImageEntrySchema = z
  .string()
  .max(2 * 1024 * 1024)
  .refine((u) => {
    const t = u.trim();
    if (/^https:\/\//i.test(t)) return true;
    if (process.env.NODE_ENV !== "production" && t.startsWith("data:image")) return true;
    return false;
  }, "Each image must be an HTTPS URL (production) or data URL (dev fallback)");

/** ORDER SYBNB-53 / SYBNB-87 — Hotel onboarding images: CDN HTTPS URLs; dev allows data URLs when Cloudinary is unset. */
export const sybnbHotelOnboardBodySchema = z.object({
  hotelName: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  images: z.array(listingImageEntrySchema).max(5).optional(),
});
