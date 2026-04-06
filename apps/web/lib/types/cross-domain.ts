/**
 * Cross-domain type re-exports — import here for boundaries docs and to reduce ad-hoc duplicates.
 * Domain-specific types stay colocated in their modules.
 */

export type { ApiResponse, Pagination, UserRole } from "@shared-types/index";
export type {
  BookingMode,
  ContactDisplayMode,
  MarketCode,
  PaymentMode,
  ResolvedMarket,
} from "@/lib/markets/types";
