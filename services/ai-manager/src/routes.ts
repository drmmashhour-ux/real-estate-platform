import { Router } from "express";
import { postListingQuality } from "./controllers/listing-quality.controller.js";
import { postPricingSuggestion } from "./controllers/pricing-suggestion.controller.js";
import { postRiskCheck } from "./controllers/risk-check.controller.js";
import { postDemandForecast } from "./controllers/demand-forecast.controller.js";
import { postHostInsights } from "./controllers/host-insights.controller.js";
import { postSupportAssistant } from "./controllers/support-assistant.controller.js";

export function createAiManagerRouter(): Router {
  const router = Router();

  router.post("/listing-quality", postListingQuality);
  router.post("/pricing-suggestion", postPricingSuggestion);
  router.post("/risk-check", postRiskCheck);
  router.post("/demand-forecast", postDemandForecast);
  router.post("/host-insights", postHostInsights);
  router.post("/support-assistant", postSupportAssistant);

  return router;
}
