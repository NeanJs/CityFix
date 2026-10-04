import type { Request, Response } from "express";
import { getConversationIssueData } from "./voice.service.js";

export async function getConversationIssue(req: Request, res: Response) {
  try {
    const conversationId = String(req.params.conversationId);

    const issue = await getConversationIssueData(conversationId);

    if (!issue) {
      return res.status(404).json({
        message: "No issue data found for this conversation",
      });
    }

    return res.json(issue);
  } catch (error) {
    console.error("Voice controller error:", error);

    return res.status(500).json({
      message: "Failed to retrieve conversation issue",
    });
  }
}
