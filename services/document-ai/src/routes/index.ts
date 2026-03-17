import { Router } from "express";
import multer from "multer";
import { analyzeDocument } from "../controllers/analyze-controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF allowed"));
  },
});

const router = Router();

router.post("/analyze", upload.single("file"), analyzeDocument);

export default router;
