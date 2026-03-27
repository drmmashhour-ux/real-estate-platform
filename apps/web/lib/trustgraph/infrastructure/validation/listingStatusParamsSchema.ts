import { z } from "zod";

export const listingStatusParamsSchema = z.object({
  listingId: z.string().min(1),
});

export type ListingStatusParams = z.infer<typeof listingStatusParamsSchema>;
