import { Router } from "express";
import {
  createReportController,
  getReportByTrackingIdController,
  analyzeReportController,
  testGeminiController,
  transcribeAudioController,
} from "./reports.controllers.js";
import voiceRoutes from "../voice/voice.route.js";
import { analyzeUpload } from "../../middleware/upload.js";
const router = Router();

router.post("/", createReportController);

router.get("/track/:trackingId", getReportByTrackingIdController);

router.post("/analyze", analyzeUpload.single("file"), analyzeReportController);
router.post(
  "/transcribe",
  analyzeUpload.single("file"),
  transcribeAudioController,
);
router.get("/test-gemini", testGeminiController);
router.use("/voice", voiceRoutes);
export default router;
