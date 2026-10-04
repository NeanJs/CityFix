import rateLimit from "express-rate-limit";

export const reportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many reports. Please try again later.",
  },
});
