import { Router } from "express";
import {
  getAdminReportByIdController,
  getAdminReportsController,
  updateReportStatusController,
} from "./admin.controllers.js";

const router = Router();
router.get("/reports/", getAdminReportsController);
router.get("/reports/:id", getAdminReportByIdController);
router.patch("/reports/:id/status", updateReportStatusController);
export default router;
