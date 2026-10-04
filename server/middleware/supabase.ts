import type { NextFunction, Request, Response } from "express";
import { createSupabaseContext } from "@supabase/server";

export async function supabaseMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const request = new Request(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    {
      method: req.method,
      headers: req.headers as Record<string, string>,
    },
  );

  const { data: context, error } = await createSupabaseContext(request, {
    auth: "none",
  });

  if (error) {
    res.status(error.status).json(error.toJSON());
    return;
  }

  res.locals.supabase = context.supabase;
  res.locals.supabaseAdmin = context.supabaseAdmin;
  res.locals.userClaims = context.userClaims;
  res.locals.jwtClaims = context.jwtClaims;

  next();
}
