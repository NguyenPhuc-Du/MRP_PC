import path from "path";
import "dotenv/config";
import * as database from "./config/database";
import { connectRedis, redisClient } from "./config/redis";

import express, { Express } from "express";
import methodOverride from "method-override";
import adminRoutes from "./routes/index.route";
import flash from "express-flash";
import session from "express-session";
import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import { systemConfig } from "./config/system";

import apiRoutes from "./api/api.routes";

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const startServer = async () => {
  const app: Express = express();
  const port: number = Number(process.env.PORT) || 3000;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  database.connectDatabase();
  await connectRedis();

  app.use(express.static(path.join(__dirname, "../public")));
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "pug");

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));

  // Flash
  app.use(cookieParser());
  app.use(session({
    store: new RedisStore({ client: redisClient, prefix: "mrp:sess:" }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS,
    },
  }));
  app.use(flash());
  // End Flash


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