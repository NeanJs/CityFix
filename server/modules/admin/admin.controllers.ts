import type { Request, Response } from "express";
import {
  getAdminReportById,
  getAdminReports,
  updateReportStatus,
} from "./admin.services.js";

export async function getAdminReportsController(_req: Request, res: Response) {
  try {
    const reports = await getAdminReports(res.locals.supabaseAdmin);

    res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error("Get admin reports error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
export async function getAdminReportByIdController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const report = await getAdminReportById(
      res.locals.supabaseAdmin,
      req.params.id,
    );

    if (!report) {
      res.status(404).json({
        error: "Report not found",
      });
      return;
    }

    res.status(200).json({
      report,
    });
  } catch (error) {
    console.error("Get admin report error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateReportStatusController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const { status } = req.body;

    const validStatuses = ["queued", "in_progress", "resolved", "rejected"];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        error: "Invalid report status",
      });
      return;
    }

    const report = await updateReportStatus(
      res.locals.supabaseAdmin,
      req.params.id,
      status,
    );

    res.status(200).json({
      report,
    });
  } catch (error) {
    console.error("Update report status error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
