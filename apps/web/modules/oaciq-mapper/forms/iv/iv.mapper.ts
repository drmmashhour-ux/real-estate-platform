import type { MapFormResult } from "../../mapper.types";
import { mapFormDefinition } from "../../map-form-definition";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";
import { ivDefinition } from "./iv.definition";

export function mapIv(canonical: CanonicalDealShape): MapFormResult {
  return mapFormDefinition(ivDefinition, canonical);
}
