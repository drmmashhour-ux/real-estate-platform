export type {
  CountryConfig,
  CountryDetailView,
  CurrencyDisplay,
  DataHandlingMode,
  GlobalCountryPerformance,
  GlobalDashboardSnapshot,
  GlobalExpansionAlert,
  HubKey,
  LaunchCountryResult,
  MarketEntryStrategy,
  RegulationView,
} from "./global.types";

export {
  allBaseCountryConfigs,
  buildCountryDetailView,
  buildGlobalDashboardSnapshot,
  getCountryConfig,
  listAllCountryConfigsForExpansion,
  marketEntryStrategyFor,
  recordCountryLaunch,
  recordPerformanceProxy,
  resetGlobalExpansionStateForTests,
  setCountryExpansionStatus,
  toCountryConfig,
} from "./global-country.service";

export {
  defaultLocaleForCountry,
  marketingAdaptationPlan,
  supportedLocalesForCountry,
  tUi,
} from "./global-localization.service";

export { conversionFootnote, formatCurrencyDisplay, normalizeToCadCents } from "./global-currency.service";

export { getRegulationViewFromConfig } from "./global-regulation.service";

export { launchCountry } from "./global-launch.service";

export { explainCountryRollout, explainIsolation } from "./global-explainability.service";
