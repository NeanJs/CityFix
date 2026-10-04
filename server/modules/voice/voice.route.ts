import { Router } from "express";
import { getConversationIssue } from "./voice.controller.js";

const router = Router();

router.get("/conversations/:conversationId/issue", getConversationIssue);

export default router;
