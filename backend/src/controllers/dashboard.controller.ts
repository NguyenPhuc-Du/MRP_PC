import { Request, Response } from "express";
import { getDashboardData } from "../services/dashboard.service";

export const index = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await getDashboardData();
    res.render("pages/dashboard/index", {
      pageTitle: "Dashboard",
      dashboard,
    });
  } catch (error) {
    console.error(error);
    res.render("pages/dashboard/index", {
      pageTitle: "Dashboard",
      dashboard: null,
    });
  }
};
