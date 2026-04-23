import { mobileFetch } from "./apiClient";

export const getRevenueSummary = () => mobileFetch<unknown>("/api/mobile/v1/host/earnings");

export const getPayoutSummary = getRevenueSummary;

export const getPerformanceStats = async () =>
  Promise.reject(new Error("Add time-series metrics endpoint when analytics API is ready"));
