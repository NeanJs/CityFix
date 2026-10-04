import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export interface OpenBlockIssue {
  conversation_id: string;
  issue_type: string | null;
  location: string | null;
  description: string | null;
  severity: string | null;
  safety_concern: string | null;
  recommended_action: string | null;
}

function getValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  return null;
}

export async function getConversationIssueData(
  conversationId: string,
): Promise<OpenBlockIssue | null> {
  const conversation =
    await elevenlabs.conversationalAi.conversations.get(conversationId);

  const data = conversation.analysis?.dataCollectionResults;

  if (!data) {
    return null;
  }

  return {
    conversation_id: conversationId,

    issue_type: getValue(data.issue_type?.value),

    location: getValue(data.location?.value),

    description: getValue(data.description?.value),

    severity: getValue(data.severity?.value),

    safety_concern: getValue(data.safety_concern?.value),

    recommended_action: getValue(data.recommended_action?.value),
  };
}
