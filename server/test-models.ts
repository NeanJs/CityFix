import "dotenv/config";
import { gemini } from "./config/gemini.js";

const models = await gemini.models.list();

for await (const model of models) {
  console.log(model.name);
}
