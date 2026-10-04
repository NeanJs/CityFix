export type IssueType =
  | "pothole"
  | "streetlight"
  | "garbage"
  | "graffiti"
  | "sidewalk"
  | "road_sign"
  | "drainage"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type ReportStatus = "queued" | "in_progress" | "resolved" | "rejected";

export interface ReportLocation {
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReportDraft {
  issue_type: IssueType;
  title: string;
  description: string;
  severity: Severity;
  location: ReportLocation;
  recommended_action: string;
  transcript?: string;
  confidence: number;
}

export interface CreateReportInput extends ReportDraft {
  photo_url?: string;
  audio_url?: string;
}

export interface Report extends CreateReportInput {
  id: string;
  tracking_id: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}
