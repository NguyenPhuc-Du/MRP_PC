import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { BomItemInput, CreateBomDto } from "../dtos/bom.dto";

import * as bomService from "../services/bom.service";
import { paginationHelper } from "../utils/pagination.utils";
const BASE = () => `${systemConfig.prefixAdmin}/bom`;

const errorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Có lỗi xảy ra";
  }

  switch (error.message) {
    case "BOM_NOT_FOUND":
      return "Không tìm thấy cấu hình BOM";
    case "NAME_REQUIRED":
      return "Tên cấu hình không được để trống";
    case "INVALID_PRICE":
      return "Giá bán phải lớn hơn 0";
    case "MISSING_REQUIRED_SLOT":
      return "BOM phải có đủ CPU, mainboard, RAM, ổ cứng, nguồn, tản nhiệt và case";
    case "NO_ITEMS":
      return "Thêm ít nhất một linh kiện vào BOM";
    case "INVALID_QTY":
      return "Số lượng linh kiện phải là số nguyên lớn hơn 0";
    case "DUPLICATE_COMPONENT":
      return "Mỗi linh kiện chỉ được xuất hiện một lần trong BOM";
    case "COMPONENT_NOT_FOUND":
      return "Linh kiện không tồn tại";
    case "COMPONENT_INACTIVE":
      return "Không gắn linh kiện đã ngừng kinh doanh";
    default:
      return "Thao tác thất bại";
  }
};

const parseNamedItems = (raw: unknown): BomItemInput[] => {
  if (!raw) {
    return [];
  }

  const rows = Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>);
  return rows.map((row) => {
    const item = row as Record<string, string>;
    return {
      componentId: Number(item.componentId),
      quantity: Number(item.quantity || 1),
    };
  });
};

const parseBomDto = (req: Request): CreateBomDto => {
  const slots = (req.body.slots || {}) as Record<string, { componentId?: string; quantity?: string }>;
  const slotItems = bomService.REQUIRED_SLOTS.map((slot) => ({
    componentId: Number(slots[slot.key]?.componentId),
    quantity: Number(slots[slot.key]?.quantity || slot.defaultQty),
  }));

  return {
    name: String(req.body.name || ""),
    description: String(req.body.description || ""),
    salePrice: Number(req.body.salePrice) || 0,
    status: req.body.status === "inactive" ? "inactive" : "active",
    items: [...slotItems, ...parseNamedItems(req.body.extras)],
  };
};

const emptyConfig = {
  id: 0,
  name: "",
  code: "Tự tạo khi lưu",
  version: "1.0",
  subtitle: "Thêm linh kiện và số lượng để lập công thức lắp ráp.",
  description: "",
  status: "approved",
  statusDb: "active",
  statusLabel: "Hoạt động",
  salePrice: "",
  itemCount: 0,
  groupCount: 0,
  totalCostText: "0 đ",
  marginText: "0,0%",
  slots: {} as Record<string, { componentId: string; quantity: number }>,
  extras: [] as Array<{ componentId: number; quantity: number }>,
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const totalConfigs = await bomService.countAllConfigs();

  const objectPagination = {
    currentPage: 1,
    countPage: 1,
    limit: 10,
    skipPage: 0,
  };

  const pagination = paginationHelper(req.query, objectPagination, totalConfigs);
  const rows = await bomService.getAllConfigs(pagination.skipPage, pagination.limit);

  res.render("pages/bom/index", {
    pageTitle: "BOM / Cấu hình PC",
    configs: rows.map(bomService.mapListConfig),
    totalConfigs,
    objectPagination: pagination,
  });
};

export const create = async (_req: Request, res: Response): Promise<void> => {
  const catalog = await bomService.getComponentOptions();
  const slots = Object.fromEntries(
    (catalog.slots || []).map((slot) => [slot.key, { componentId: "", quantity: slot.defaultQty }]),
  );

  res.render("pages/bom/form", {
    pageTitle: "Tạo cấu hình BOM",
    mode: "create",
    formAction: `${BASE()}/create`,
    config: { ...emptyConfig, slots },
    catalog,
  });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await bomService.createConfig(parseBomDto(req));
    req.flash("success", "Tạo cấu hình BOM thành công");
    res.redirect(`${BASE()}/detail/${config.id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(`${BASE()}/create`);
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  try {
    const [row, catalog] = await Promise.all([
      bomService.getConfigById(Number(req.params.id)),
      bomService.getComponentOptions(),
    ]);

    res.render("pages/bom/form", {
      pageTitle: row.name,
      mode: "edit",
      formAction: `${BASE()}/detail/${row.id}`,
      config: bomService.mapDetailConfig(row),
      catalog,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOM_NOT_FOUND") {
      req.flash("error", errorMessage(error));
      res.redirect(BASE());
      return;
    }

    throw error;
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  try {
    await bomService.updateConfig(id, parseBomDto(req));
    req.flash("success", "Cập nhật cấu hình BOM thành công");
    res.redirect(`${BASE()}/detail/${id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(`${BASE()}/detail/${id}`);
  }
};
