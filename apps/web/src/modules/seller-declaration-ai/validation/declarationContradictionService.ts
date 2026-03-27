export function detectDeclarationContradictions(payload: Record<string, unknown>) {
  const flags: string[] = [];
  const knownDefectsFlag = payload.known_defects_flag === true || payload.known_defects_flag === "true";
  const waterDamageFlag = payload.water_damage_flag === true || payload.water_damage_flag === "true";
  const knownDefectsDetails = String(payload.known_defects_details ?? "").trim();
  const waterDetails = String(payload.water_damage_details ?? "").trim();
  const tenantPresent = payload.tenant_present === true || payload.tenant_present === "true";
  const leaseDetails = String(payload.lease_details ?? "").trim();

  if (!knownDefectsFlag && waterDamageFlag) {
    flags.push("No known defects conflicts with disclosed water infiltration.");
  }
  if (knownDefectsFlag && !knownDefectsDetails) {
    flags.push("Known defects marked yes but details missing.");
  }
  if (waterDamageFlag && !waterDetails) {
    flags.push("Water damage marked yes but details missing.");
  }
  if (tenantPresent && !leaseDetails) {
    flags.push("Tenant status is yes but lease details are missing.");
  }

  return flags;
}
