import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabaseMiddleware } from "./middleware/supabase.js";
import reportsRoutes from "./modules/reports/reports.route.js";
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
app.use("/api/reports", supabaseMiddleware, reportRateLimit, reportsRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`CityFix API running on port ${PORT}`);
});
