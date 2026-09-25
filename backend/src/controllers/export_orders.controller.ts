import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { ExportOrderFilter } from "../dtos/export-order.dto";
import * as exportOrderService from "../services/export.service";

const BASE = () => `${systemConfig.prefixAdmin}/exportOrders`;

const errorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return "Có lỗi xảy ra";
  switch (error.message) {
    case "NOT_FOUND":
      return "Không tìm thấy phiếu xuất";
    case "NOT_PENDING":
      return "Chỉ duyệt hoặc từ chối phiếu đang chờ";
    case "STOCK_NOT_ENOUGH":
      return "Không đủ tồn để duyệt phiếu xuất";
    case "INVALID_LINE":
      return "Phiếu xuất linh kiện thiếu mã linh kiện";
    default:
      return "Thao tác thất bại";
  }
};

const filterFromQuery = (query: Request["query"]): ExportOrderFilter => ({
  q: String(query.q || ""),
  type: String(query.type || "") as ExportOrderFilter["type"],
  status: String(query.status || "") as ExportOrderFilter["status"],
  from: String(query.from || "") || undefined,
  to: String(query.to || "") || undefined,
  page: Number(query.page || 1),
  limit: Number(query.limit || 20),
});

export const index = async (req: Request, res: Response): Promise<void> => {
  const filters = filterFromQuery(req.query);
  const [list, stats] = await Promise.all([
    exportOrderService.listOrders(filters),
    exportOrderService.getStats(),
  ]);
  res.render("pages/exportOrders/index", {
    pageTitle: "Phiếu xuất",
    ...list,
    stats,
    filters,
  });
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  const order = await exportOrderService.getDetail(orderId);
  if (!order) {
    req.flash("error", "Không tìm thấy phiếu xuất");
    res.redirect(BASE());
    return;
  }
  res.render("pages/exportOrders/detail", { pageTitle: order.code, order });
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  const accountId = req.session.account?.id;
  if (!accountId) {
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }
  try {
    await exportOrderService.approve(orderId, accountId);
    req.flash("success", "Đã duyệt phiếu xuất");
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
  }
  res.redirect(`${BASE()}/${orderId}`);
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  const accountId = req.session.account?.id;
  if (!accountId) {
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }
  try {
    await exportOrderService.reject(orderId, accountId);
    req.flash("success", "Đã từ chối phiếu xuất");
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
  }
  res.redirect(`${BASE()}/${orderId}`);
};
