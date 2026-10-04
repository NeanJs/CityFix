import { SupabaseContext } from "@supabase/server";
import { CreateReportInput } from "../../types/reports.types.js";

export async function createReport(
  supabase: SupabaseContext["supabaseAdmin"],
  input: CreateReportInput,
): Promise<Report> {
  const trackingId = `CF-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 6)
    .toUpperCase()}`;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      tracking_id: trackingId,
      issue_type: input.issue_type,
      title: input.title,
      description: input.description,
      severity: input.severity,
      transcript: input.transcript ?? null,
      recommended_action: input.recommended_action,
      photo_url: input.photo_url ?? null,
      audio_url: input.audio_url ?? null,
      latitude: input.location.latitude ?? null,
      longitude: input.location.longitude ?? null,
      location_description: input.location.description ?? null,
      status: "queued",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Report;
}

export async function getReportByTrackingId(
  supabase: SupabaseContext["supabaseAdmin"],
  trackingId: string,
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Report | null;
}
