/**
 * Demand proxy from internal engagement only (views/saves/funnel — not fabricated demand).
 */
export type DemandSignal = {
  city: string;
  propertyType: string | null;
  priceRangeLabel: string;
  score: number;
  views7d: number;
  saves7d: number;
  searches7d: number;
};
