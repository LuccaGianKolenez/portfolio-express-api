import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { env, corsOrigins } from "./env";
import { httpLogger } from "./logger";
import api from "./routes";
import { errorHandler } from "./middleware/error-handler";
import client from "prom-client";

const app = express();

// CORS
app.use(cors({ origin: corsOrigins, credentials: true }));

// Logs HTTP
app.use(httpLogger);

// JSON
app.use(express.json());

// Métricas Prometheus
client.collectDefaultMetrics();
app.get("/api/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Swagger (serve openapi.json estático)
const openapiPath = path.join(__dirname, "docs", "openapi.json");
if (fs.existsSync(openapiPath)) {
  const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc, { customSiteTitle: "Portfolio Express API" }));
}

// API
app.use("/api", api);

// Erros
app.use(errorHandler);

export default app;
