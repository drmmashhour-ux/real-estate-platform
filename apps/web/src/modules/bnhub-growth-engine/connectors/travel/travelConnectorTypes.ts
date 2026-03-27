/**
 * Super-app travel connector contract — no live booking claims until a provider is integrated.
 */
export type TravelConnectorHealth = { ok: boolean; message: string };

export type TravelSearchParams = Record<string, unknown>;

export interface BnhubTravelConnector {
  readonly key: string;
  validateSetup(): Promise<TravelConnectorHealth>;
  searchProducts(params: TravelSearchParams): Promise<{ items: unknown[]; disclaimer: string }>;
  getQuote(productRef: string): Promise<{ quoteCents: number | null; currency: string; disclaimer: string }>;
  reserve(_input: unknown): Promise<{ ok: false; reason: string }>;
  cancel(_ref: string): Promise<{ ok: false; reason: string }>;
  syncStatus(_ref: string): Promise<{ status: string; disclaimer: string }>;
}
