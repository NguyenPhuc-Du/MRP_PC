import path from "path";
import "dotenv/config";
import * as database from "./config/database";

import express, { Express } from "express";
import methodOverride from "method-override";
import adminRoutes from "./routes/index.route";
import { systemConfig } from "./config/system";

import apiRoutes from "./api/api.routes";

const startServer = async () => {
  const app: Express = express();
  const port: number = Number(process.env.PORT) || 3000;

  database.connectDatabase();

  app.use(express.static(path.join(__dirname, "../public")));
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "pug");

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));

  // API routes for app
  app.use("/api", apiRoutes);

  app.locals.prefixAdmin = systemConfig.prefixAdmin;

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mrp-pc-backend" });
  });

  adminRoutes(app);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer();