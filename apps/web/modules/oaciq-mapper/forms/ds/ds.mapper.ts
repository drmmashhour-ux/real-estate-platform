import type { MapFormResult } from "../../mapper.types";
import { mapFormDefinition } from "../../map-form-definition";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";
import { dsDefinition } from "./ds.definition";

export function mapDs(canonical: CanonicalDealShape): MapFormResult {
  return mapFormDefinition(dsDefinition, canonical);
}
