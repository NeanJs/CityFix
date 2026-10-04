import type { Request, Response } from "express";
import type { CreateReportInput } from "../../types/reports.types.js";
import {
  createReport,
  getReportByTrackingId,
  testGemini,
} from "./reports.services.js";
import { analyzeImage, analyzeText } from "./ai/ai.service.js";

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

export async function analyzeReportController(req: Request, res: Response) {
  try {
    const text = req.body.text as string | undefined;
    const file = req.file;

    if (!text && !file) {
      res.status(400).json({
        error: "Provide either text or a file",
      });
      return;
    }

    if (text && file) {
      res.status(400).json({
        error: "Provide only one input: text or file",
      });
      return;
    }

    if (text) {
      const draft = await analyzeText(text);

      res.status(200).json({
        draft,
      });

      return;
    }

    if (file) {
      if (!file.mimetype.startsWith("image/")) {
        res.status(400).json({
          error: "Only images are supported for photo analysis",
        });
        return;
      }

      const draft = await analyzeImage(file.buffer, file.mimetype);

      res.status(200).json({
        draft,
      });

      return;
    }
  } catch (error) {
    console.error("Analyze report error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function testGeminiController(_req: Request, res: Response) {
  try {
    const result = await testGemini();

    res.status(200).json({
      result,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
