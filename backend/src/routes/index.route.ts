import { Express } from "express";
import { systemConfig } from "../config/system";
import { componentRoutes } from "./components.route";

const adminRoutes = (app: Express): void =>{
    const PATH_ADMIN = `${systemConfig.prefixAdmin}`;

    app.use(`${PATH_ADMIN}/components`, componentRoutes);

}
export default adminRoutes;