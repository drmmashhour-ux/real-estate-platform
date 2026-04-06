/**
 * Hub search / discovery — configuration-driven; BNHub maps filters to existing search API.
 */

import type { HubDefinition, HubSearchConfig } from "./hub-types";

export type HubSearchQuery = Record<string, string | number | boolean | undefined>;

export function getSearchConfig(hub: HubDefinition): HubSearchConfig {
  return hub.search;
}

export function validateSortForHub(hub: HubDefinition, sort: string): boolean {
  return hub.search.allowedSorts.includes(sort);
}
