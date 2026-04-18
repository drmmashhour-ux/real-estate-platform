import type { MapFormResult } from "../../mapper.types";
import { mapFormDefinition } from "../../map-form-definition";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";
import { cpDefinition } from "./cp.definition";

export function mapCp(canonical: CanonicalDealShape): MapFormResult {
  return mapFormDefinition(cpDefinition, canonical);
}
