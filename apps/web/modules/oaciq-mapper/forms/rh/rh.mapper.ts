import type { MapFormResult } from "../../mapper.types";
import { mapFormDefinition } from "../../map-form-definition";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";
import { rhDefinition } from "./rh.definition";

export function mapRh(canonical: CanonicalDealShape): MapFormResult {
  return mapFormDefinition(rhDefinition, canonical);
}
