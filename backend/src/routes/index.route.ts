import { Express } from "express";
import { systemConfig } from "../config/system";
import { dashboardRoutes } from "./dashboard.route";
import { componentRoutes } from "./components.route";
import { accountRoutes } from "./account.route";
import { importOrderRoutes } from "./import_orders.route";
import { exportOrderRoutes } from "./export_orders.route";
import { bomRoutes } from "./bom.route";
import { permissionRoutes } from "./permissions.route";
import { authRoutes } from "./auth.route";
import { requireAuth } from "../middlewares/auth.middleware";
import { productionRoutes } from "./production.route";
import { backupRoutes } from "./backup.route";

const mountPanel = (app: Express, prefix: string): void => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(prefix, requireAuth);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/components`, componentRoutes);
  app.use(`${prefix}/accounts`, accountRoutes);
  app.use(`${prefix}/importOrders`, importOrderRoutes);
  app.use(`${prefix}/exportOrders`, exportOrderRoutes);
  app.use(`${prefix}/bom`, bomRoutes);
  app.use(`${prefix}/permissions`, permissionRoutes);
  app.use(`${prefix}/production`, productionRoutes);
  app.use(`${prefix}/backup`, backupRoutes);
};

const adminRoutes = (app: Express): void => {
  mountPanel(app, systemConfig.prefixAdmin);
  mountPanel(app, systemConfig.prefixWarehouse);
};

export default adminRoutes;
