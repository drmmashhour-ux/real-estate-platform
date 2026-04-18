import type { MapFormResult } from "./mapper.types";
import type { CanonicalDealShape } from "./source-paths/canonical-deal-shape";
import { mapCp } from "./forms/cp/cp.mapper";
import { mapDs } from "./forms/ds/ds.mapper";
import { mapIv } from "./forms/iv/iv.mapper";
import { mapPp } from "./forms/pp/pp.mapper";
import { mapRh } from "./forms/rh/rh.mapper";
import { mapRis } from "./forms/ris/ris.mapper";

export function mapFormByKey(formKey: string, canonical: CanonicalDealShape): MapFormResult {
  switch (formKey.toUpperCase()) {
    case "PP":
      return mapPp(canonical);
    case "CP":
      return mapCp(canonical);
    case "DS":
      return mapDs(canonical);
    case "IV":
      return mapIv(canonical);
    case "RIS":
      return mapRis(canonical);
    case "RH":
      return mapRh(canonical);
    default:
      throw new Error(`Unknown OACIQ form key: ${formKey}`);
  }
}
