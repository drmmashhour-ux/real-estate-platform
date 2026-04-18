import type { MapFormResult } from "../../mapper.types";
import { mapFormDefinition } from "../../map-form-definition";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";
import { risDefinition } from "./ris.definition";

export function mapRis(canonical: CanonicalDealShape): MapFormResult {
  return mapFormDefinition(risDefinition, canonical);
}
