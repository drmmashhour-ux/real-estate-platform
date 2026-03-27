import type {
  ComparablePropertyNormalized,
  NeighborhoodSignalsNormalized,
  PropertyDetailsNormalized,
  RentEstimateNormalized,
} from "./types";

/**
 * Abstract provider — implement per vendor; scoring imports only this interface.
 */
export interface MarketDataProvider {
  readonly id: string;
  isAvailable(): boolean;
  getPropertyDetails?(args: { address: string; city: string; region?: string }): Promise<PropertyDetailsNormalized | null>;
  getComparables?(args: { listingId: string }): Promise<ComparablePropertyNormalized[]>;
  getRentEstimate?(args: { address: string; beds?: number | null }): Promise<RentEstimateNormalized | null>;
  getNeighborhood?(args: { city: string; postal?: string }): Promise<NeighborhoodSignalsNormalized | null>;
}
