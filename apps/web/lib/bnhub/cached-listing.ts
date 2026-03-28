import { cache } from "react";
import { getListingById } from "@/lib/bnhub/listings";

/** Dedupe listing fetch within the same request (metadata + page). */
export const getCachedBnhubListingById = cache(getListingById);
