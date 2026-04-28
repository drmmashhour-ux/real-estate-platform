import { z } from "zod";

/** ORDER SYBNB-53 — Public hotel onboarding POST body (listing images as data URLs). */
export const sybnbHotelOnboardBodySchema = z.object({
  hotelName: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  images: z.array(z.string().min(20)).max(5).optional(),
});
