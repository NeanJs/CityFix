import { Type } from "@google/genai";

export const reportDraftSchema = {
  type: Type.OBJECT,
  properties: {
    issue_type: {
      type: Type.STRING,
      enum: [
        "pothole",
        "streetlight",
        "garbage",
        "graffiti",
        "sidewalk",
        "road_sign",
        "drainage",
        "other",
      ],
    },
    title: {
      type: Type.STRING,
    },
    description: {
      type: Type.STRING,
    },
    severity: {
      type: Type.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    recommended_action: {
      type: Type.STRING,
    },
    confidence: {
      type: Type.NUMBER,
    },
  },
  required: [
    "issue_type",
    "title",
    "description",
    "severity",
    "recommended_action",
    "confidence",
  ],
};
