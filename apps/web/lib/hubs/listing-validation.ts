/**
 * Listing validation – all hubs must enforce title, description, price, location, images.
 * Status: draft | pending_review | approved (admin approval for luxury, projects, brokers).
 */

import { getHubConfig } from "@/config/hubs";
import type { ListingStatusValue } from "./contract-types";

export type ListingValidationResult = {
  valid: boolean;
  missing: string[];
  canPublish: boolean;
  mustSubmitForReview: boolean;
};

/** Required fields for any hub listing */
const REQUIRED = ["title", "description", "price", "location", "images"] as const;

export function validateListingFields(data: {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  location?: string | null;
  images?: unknown[] | null;
  city?: string | null;
  address?: string | null;
}): ListingValidationResult {
  const missing: string[] = [];
  if (!data.title?.trim()) missing.push("title");
  if (!data.description?.trim()) missing.push("description");
  if (data.price == null || Number(data.price) < 0) missing.push("price");
  const hasLocation = !!(data.location?.trim() || data.address?.trim() || data.city?.trim());
  if (!hasLocation) missing.push("location");
  const hasImages = Array.isArray(data.images) && data.images.length > 0;
  if (!hasImages) missing.push("images");

  return {
    valid: missing.length === 0,
    missing,
    canPublish: missing.length === 0,
    mustSubmitForReview: false,
  };
}

/** Whether this hub requires admin approval before listing is public */
export function hubRequiresListingApproval(hubKey: string): boolean {
  const config = getHubConfig(hubKey.toLowerCase());
  return config?.requiresListingApproval ?? false;
}

/** Valid listing statuses for workflow */
export const LISTING_STATUS_FLOW: ListingStatusValue[] = ["draft", "pending_review", "approved", "published"];
