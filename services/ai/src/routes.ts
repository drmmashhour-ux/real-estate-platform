import { Router } from "express";
import { postListingAnalysis } from "./controllers/listing-analysis.controller.js";
import { postPricing } from "./controllers/pricing.controller.js";
import { postDemand } from "./controllers/demand.controller.js";
import { postFraudCheck } from "./controllers/fraud.controller.js";
import { postSupport } from "./controllers/support.controller.js";

export function createAiRouter(): Router {
  const router = Router();

  router.post("/listing-analysis", postListingAnalysis);
  router.post("/pricing", postPricing);
  router.post("/demand", postDemand);
  router.post("/fraud-check", postFraudCheck);
  router.post("/support", postSupport);

  return router;
}
