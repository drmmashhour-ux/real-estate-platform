import { Router } from "express";
import {
  handleSaleValuation,
  handleLongTermRentValuation,
  handleShortTermRentValuation,
  handleInvestmentValuation,
} from "../controllers/valuation-controller.js";

const router = Router();

router.post("/sale", handleSaleValuation);
router.post("/long-term-rent", handleLongTermRentValuation);
router.post("/short-term-rent", handleShortTermRentValuation);
router.post("/investment", handleInvestmentValuation);

export default router;
