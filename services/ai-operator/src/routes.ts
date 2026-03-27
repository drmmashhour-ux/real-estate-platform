import { Router } from "express";
import { postListingsAnalyze } from "./controllers/listings.controller.js";
import { postPricingRecommend, getPricingByListingId } from "./controllers/pricing.controller.js";
import { postFraudEvaluate } from "./controllers/fraud.controller.js";
import { postBookingsCheck } from "./controllers/bookings.controller.js";
import { postDemandForecast, getForecastByMarket } from "./controllers/demand.controller.js";
import { postHostsAnalyze, getHostById } from "./controllers/hosts.controller.js";
import { postSupportTriage } from "./controllers/support.controller.js";
import { postMarketplaceHealth } from "./controllers/marketplace.controller.js";
import { getAlertsList } from "./controllers/alerts.controller.js";
import { getDecisionsList, postDecisionOverride } from "./controllers/decisions.controller.js";

export function createOperatorRouter(): Router {
  const router = Router();

  router.post("/listings/analyze", postListingsAnalyze);
  router.post("/pricing/recommend", postPricingRecommend);
  router.get("/pricing/:listingId", getPricingByListingId);
  router.post("/fraud/evaluate", postFraudEvaluate);
  router.post("/bookings/check", postBookingsCheck);
  router.post("/demand/forecast", postDemandForecast);
  router.get("/forecast/:market", getForecastByMarket);
  router.post("/hosts/analyze", postHostsAnalyze);
  router.get("/hosts/:hostId", getHostById);
  router.post("/support/triage", postSupportTriage);
  router.post("/marketplace/health", postMarketplaceHealth);

  router.get("/alerts", getAlertsList);
  router.get("/decisions", getDecisionsList);
  router.post("/decisions/:id/override", postDecisionOverride);

  return router;
}
