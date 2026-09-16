import { Express } from "express";
import { systemConfig } from "../config/system";
import { componentRoutes } from "./components.route";
import { accountRoutes } from "./account.route";

const adminRoutes = (app: Express): void =>{
    const PATH_ADMIN = `${systemConfig.prefixAdmin}`;

    app.use(`${PATH_ADMIN}/components`, componentRoutes);

    app.use(`${PATH_ADMIN}/accounts`, accountRoutes);

}
export default adminRoutes;