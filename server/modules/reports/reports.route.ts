import { Router } from "express";
import {
  createReportController,
  getReportByTrackingIdController,
} from "./reports.controller.js";

const router = Router();

router.post("/", createReportController);

router.get("/track/:trackingId", getReportByTrackingIdController);

export default router;
