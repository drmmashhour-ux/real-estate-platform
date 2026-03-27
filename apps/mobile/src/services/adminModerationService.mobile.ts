import { mobileFetch } from "./apiClient";

export const listApprovalQueue = async () =>
  Promise.reject(new Error("Paginated listing PENDING_REVIEW — extend admin mobile API"));

export const listSafetyQueue = async () =>
  Promise.reject(new Error("Query bnhub_listing_safety_profiles MANUAL_REVIEW_REQUIRED"));

export const listFraudQueue = async () => Promise.reject(new Error("Use web admin fraud UI"));

export const approveListing = async (_listingId: string) => Promise.reject(new Error("POST admin action"));
export const restrictListing = approveListing;
export const rejectListing = approveListing;
export const resolveFlag = approveListing;
export const requestDocuments = approveListing;
export const lockListingPublication = approveListing;

export const getModerationSummary = () => mobileFetch<unknown>("/api/mobile/v1/admin/queues");
