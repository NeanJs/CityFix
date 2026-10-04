import { gemini } from "../../../config/gemini.js";
import { ReportDraft } from "../../../types/reports.types.js";

import { reportDraftSchema } from "./ai.schema.js";

const MODEL = "gemini-3.5-flash-lite";
const MAX_INPUT_LENGTH = 2000;
const MAX_RETRIES = 2;

const SYSTEM_PROMPT = `
You are CityFix's issue-reporting assistant.
Analyze the submitted report and return:
- issue type
- short title
- factual description
- severity
- recommended action
- confidence from 0 to 1

Use "other" when uncertain.
Do not invent facts, measurements, locations, or details.
Return only the requested structured data.
`;

function isRetryableError(error: unknown) {
  const message = JSON.stringify(error);

  return (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateReport(
  contents: Parameters<typeof gemini.models.generateContent>[0]["contents"],
) {
  let response;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await gemini.models.generateContent({
        model: MODEL,
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: reportDraftSchema,
          maxOutputTokens: 300,
        },
      });

      break;
    } catch (error) {
      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      await sleep(500 * 2 ** attempt);
    }
  }

  if (!response?.text) {
    throw new Error("Gemini returned an empty response");
  }

  return JSON.parse(response.text) as Omit<ReportDraft, "location">;
}

export function analyzeText(input: string) {
  const text = input.trim().slice(0, MAX_INPUT_LENGTH);

  if (!text) {
    throw new Error("Input cannot be empty");
  }

  return generateReport(`${SYSTEM_PROMPT}\n\nReport:\n${text}`);
}

export function analyzeImage(buffer: Buffer, mimeType: string) {
  if (!buffer.length) {
    throw new Error("Image cannot be empty");
  }

  return generateReport([
    {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    },
    { text: SYSTEM_PROMPT },
  ]);
}
