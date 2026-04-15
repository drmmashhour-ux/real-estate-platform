import { Router, type IRouter } from "express";
import multer from "multer";
import { analyzeDocument } from "../controllers/analyze-controller.js";
import { isSupportedUploadFile } from "../services/upload-validation.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isSupportedUploadFile(file)) cb(null, true);
    else cb(new Error("Only PDF or Adobe Illustrator (.ai) files are allowed"));
  },
});

const router: IRouter = Router();

router.post("/analyze", upload.single("file"), analyzeDocument);

export default router;
