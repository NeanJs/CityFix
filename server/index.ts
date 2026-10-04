import "dotenv/config";
import express from "express";
import cors from "cors";
import reportsRoutes from "./modules/reports/reports.routes.js";
// import adminRoutes from "./modules/admin/admin.routes.js";
import { supabaseMiddleware } from "./middleware/supabase.js";
import { reportRateLimit } from "./middleware/rateLimit.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CityFix API is running",
  });
});
app.use("/api/reports", supabaseMiddleware, reportsRoutes);
// app.use(
//   "/api/admin",
//   (req, res, next) => {
//     supabaseMiddleware(req, res, next, "user");
//   },
//   adminRoutes,
// );

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`CityFix API running on port ${PORT}`);
});
