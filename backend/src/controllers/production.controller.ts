import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { paginationHelper } from "../utils/pagination.utils";
import * as productionService from "../services/production.service";

const BASE = () => `${systemConfig.prefixAdmin}/production`;

const errorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Có lỗi xảy ra";
  }

  switch (error.message) {
    case "CONFIG_NOT_FOUND":
      return "Không tìm thấy cấu hình PC";
    case "CONFIG_INACTIVE":
      return "Cấu hình PC đang ngừng sử dụng";
    case "STAFF_INVALID":
      return "Chỉ giao việc cho nhân viên lắp ráp đang hoạt động";
    case "INVALID_QUANTITY":
      return "Số lượng phải lớn hơn 0";
    case "ORDER_NOT_FOUND":
      return "Không tìm thấy yêu cầu sản xuất";
    default:
      return "Tạo yêu cầu sản xuất thất bại";
  }
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const totalOrders = await productionService.countAllOrders();
  const objectPagination = {
    currentPage: 1,
    countPage: 1,
    limit: 10,
    skipPage: 0,
  };
  const pagination = paginationHelper(req.query, objectPagination, totalOrders);
  const [{ orders }, stages] = await Promise.all([
    productionService.getIndexData(pagination.skipPage, pagination.limit),
    productionService.getStageCounts(),
  ]);

  res.render("pages/production/index", {
    pageTitle: "Sản xuất",
    orders,
    stages,
    totalOrders,
    objectPagination: pagination,
  });
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const { pcConfigs, accounts } = await productionService.getCreateFormData();

  res.render("pages/production/create", {
    pageTitle: "Tạo yêu cầu sản xuất",
    pcConfigs,
    accounts,
    today: new Date().toLocaleDateString("vi-VN"),
  });
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);

  try {
    const order = await productionService.getOrderDetail(orderId);
    if (!order) {
      req.flash("error", "Không tìm thấy yêu cầu sản xuất");
      res.redirect(BASE());
      return;
    }

    res.render("pages/production/detail", {
      pageTitle: `Yêu cầu #${order.code}`,
      order,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Không tải được chi tiết yêu cầu");
    res.redirect(BASE());
  }
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  const createdBy = req.session.account?.id;
  if (!createdBy) {
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }

  try {
    const assignedRaw = Number(req.body.assignedTo);
    const order = await productionService.createProductionOrder({
      createdBy,
      pcConfigId: Number(req.body.pcConfigId),
      quantityRequested: 1,
      assignedTo: assignedRaw > 0 ? assignedRaw : undefined,
    });

    const assigneeName =
      order.assignee?.fullName || order.assignee?.username || "";

    req.flash(
      "success",
      assigneeName
        ? `Đã giao yêu cầu #${order.id} (${order.pcConfig.name} × ${order.quantityRequested}) cho ${assigneeName}. Nhân viên sẽ thấy trên app.`
        : `Đã tạo yêu cầu #${order.id} (${order.pcConfig.name} × ${order.quantityRequested}). Chưa phân công.`,
    );
    res.redirect(BASE());
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(`${BASE()}/create`);
  }
};
