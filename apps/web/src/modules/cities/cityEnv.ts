export function isMultiCityOperationsEnabled(): boolean {
  return process.env.AI_MULTI_CITY_OPERATIONS_ENABLED === "1";
}

export function isCityAutoRecommendationsEnabled(): boolean {
  return process.env.AI_CITY_AUTO_RECOMMENDATIONS_ENABLED === "1";
}

export function isCitySafeAutoActionsEnabled(): boolean {
  return process.env.AI_CITY_SAFE_AUTO_ACTIONS_ENABLED === "1";
}
