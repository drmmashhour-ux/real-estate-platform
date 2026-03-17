/**
 * LECIPM shared types.
 */

export type UserRole = "guest" | "host" | "broker" | "admin";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};
