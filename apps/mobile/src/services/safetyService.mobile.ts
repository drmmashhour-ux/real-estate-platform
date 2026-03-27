import { mobileFetch } from "./apiClient";

export const getListingSafetyStatus = (listingId: string) =>
  mobileFetch<unknown>(`/api/mobile/v1/safety/listing/${listingId}`);

export const reportSafetyIssue = async (_payload: object) =>
  Promise.reject(new Error("POST trust safety incident — reuse web endpoint"));

export const getHostSafetyRequirements = async (_listingId: string) =>
  Promise.reject(new Error("GET host-safe requirements from bnhub_listing_safety_profiles"));

export const requestManualReviewStatus = async (_listingId: string) =>
  Promise.reject(new Error("Host-triggered review request + audit log"));
