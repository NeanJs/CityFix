import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "CityFix API is running",
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`CityFix API running on port ${PORT}`);
});
