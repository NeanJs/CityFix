import { Router } from "express";
import {
  createReportController,
  getReportByTrackingIdController,
  analyzeReportController,
  testGeminiController
} from "./reports.controller.js";
import { analyzeUpload } from "../../middleware/upload.js";

const router = Router();

router.post("/", createReportController);

router.get("/track/:trackingId", getReportByTrackingIdController);

router.post("/analyze", analyzeUpload.single("file"), analyzeReportController);

router.get("/test-gemini", testGeminiController);

export default router;
