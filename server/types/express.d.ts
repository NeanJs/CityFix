import type { SupabaseContext } from "@supabase/server";

declare global {
  namespace Express {
    interface Locals {
      supabase: SupabaseContext["supabase"];
      supabaseAdmin: SupabaseContext["supabaseAdmin"];
      userClaims: SupabaseContext["userClaims"];
      jwtClaims: SupabaseContext["jwtClaims"];
    }
  }
}

export {};
