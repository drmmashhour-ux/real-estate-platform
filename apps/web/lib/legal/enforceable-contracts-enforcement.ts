/** When true, hub gates require a signed enforceable `Contract` row (see `ENFORCEABLE_CONTRACT_TYPES`). */
export function enforceableContractsRequired(): boolean {
  return process.env.ENFORCEABLE_CONTRACTS_REQUIRED === "true";
}
