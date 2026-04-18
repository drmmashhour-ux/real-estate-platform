import type { MapFormResult } from "../../mapper.types";
import { mapFormDefinition } from "../../map-form-definition";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";
import { ppDefinition } from "./pp.definition";

export function mapPp(canonical: CanonicalDealShape): MapFormResult {
  return mapFormDefinition(ppDefinition, canonical);
}
