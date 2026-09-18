import { Express } from "express";
import { systemConfig } from "../config/system";
import { componentRoutes } from "./components.route";
import { accountRoutes } from "./account.route";
import { importOrderRoutes } from "./import_orders.route";
import { exportOrderRoutes } from "./export_orders.route";
import { bomRoutes } from "./bom.route";
import { permissionRoutes } from "./permissions.route";
import { authRoutes } from "./auth.route";

const adminRoutes = (app: Express): void => {
  const PATH_ADMIN = `${systemConfig.prefixAdmin}`;

  app.use(`${PATH_ADMIN}/components`, componentRoutes);

  app.use(`${PATH_ADMIN}/accounts`, accountRoutes);

  app.use(`${PATH_ADMIN}/importOrders`, importOrderRoutes);

  app.use(`${PATH_ADMIN}/exportOrders`, exportOrderRoutes);

  app.use(`${PATH_ADMIN}/bom`, bomRoutes);

  app.use(`${PATH_ADMIN}/permissions`, permissionRoutes);
};

    app.use(`${PATH_ADMIN}/auth`, authRoutes);


}
export default adminRoutes;
