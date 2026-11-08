import { Request, Response } from "express";
import { getDashboardData } from "../services/dashboard.service";
import {
  writeDashboardExcel,
  writeDashboardPdf,
} from "../utils/dashboard-export";

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

export const exportExcel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dashboard = await getDashboardData();
    await writeDashboardExcel(res, dashboard);
  } catch (error) {
    console.error(error);
    req.flash("error", "Xuất báo cáo Excel thất bại");
    res.redirect("back");
  }
};

export const exportPdf = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dashboard = await getDashboardData();
    writeDashboardPdf(res, dashboard);
  } catch (error) {
    console.error(error);
    req.flash("error", "Xuất báo cáo PDF thất bại");
    res.redirect("back");
  }
};
