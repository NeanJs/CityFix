import type { Request, Response } from "express";
import { CreateReportInput } from "../../types/reports.types.js";
import { createReport, getReportByTrackingId } from "./reports.service.js";

export async function createReportController(req: Request, res: Response) {
  try {
    const input = req.body as CreateReportInput;

    if (!input.issue_type || !input.title || !input.description) {
      res.status(400).json({
        error: "issue_type, title, and description are required",
      });
      return;
    }

    const report = await createReport(res.locals.supabaseAdmin, input);

    res.status(201).json({
      report,
    });
  } catch (error) {
    console.error("Create report error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getReportByTrackingIdController(
  req: Request<{ trackingId: string }>,
  res: Response,
) {
  try {
    const trackingId = req.params.trackingId;

    if (!trackingId) {
      res.status(400).json({
        error: "Tracking ID is required",
      });
      return;
    }

    const report = await getReportByTrackingId(
      res.locals.supabaseAdmin,
      trackingId,
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
    console.error("Get report error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
