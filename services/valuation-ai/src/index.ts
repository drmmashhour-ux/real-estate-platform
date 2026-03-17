import express from "express";
import routes from "./routes/index.js";

const app = express();
app.use(express.json());
app.use("/valuation", routes);
app.get("/health", (_req, res) => res.json({ status: "ok", service: "valuation-ai" }));

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Valuation AI service listening on port ${port}`);
});
