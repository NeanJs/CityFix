import type { SupabaseContext } from "@supabase/server";
import type { Report } from "../../types/reports.types.js";

export async function getAdminReports(
  supabase: SupabaseContext["supabaseAdmin"],
): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Report[];
}

export async function getAdminReportById(
  supabase: SupabaseContext["supabaseAdmin"],
  id: string,
): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Report | null;
}
export async function updateReportStatus(
  supabase: SupabaseContext["supabaseAdmin"],
  id: string,
  status: Report["status"],
): Promise<Report> {
  const { data, error } = await supabase
    .from("reports")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Report;
}
