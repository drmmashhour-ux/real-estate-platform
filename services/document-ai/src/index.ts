import express, { type Application } from "express";
import routes from "./routes/index.js";

const app: Application = express();
const port = process.env.PORT ?? 4005;

app.use(express.json({ limit: "1mb" }));
app.use("/", routes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "document-ai" });
});

app.listen(port, () => {
  console.log(`Document AI service listening on port ${port}`);
});
