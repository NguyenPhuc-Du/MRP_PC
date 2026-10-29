import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { BomItemInput, CreateBomDto } from "../dtos/bom.dto";

import * as bomService from "../services/bom.service";
import { BomFormDraft } from "../services/bom.service";
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
      return "Giá bán không hợp lệ";
    case "PRICE_TOO_LARGE":
      return "Giá bán tối đa 9.999.999.999 đ. Để trống nếu chưa chốt giá";
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
    case "SLOT_SINGLE_ONLY":
      return "CPU, mainboard, nguồn và case: mỗi loại đúng 1 linh kiện, số lượng 1";
    case "INVALID_RAM":
      return "RAM phải từ 1 đến 4 thanh";
    case "GPU_SINGLE_ONLY":
      return "Chỉ được 1 GPU trong BOM";
    case "SALE_BELOW_COST":
      return "Giá chốt không được nhỏ hơn giá vốn";
    default:
      break;
  }

  if (error.message.startsWith("INCOMPATIBLE_SOCKET:")) {
    const [, cpuSocket, mainSocket] = error.message.split(":");
    return `Socket CPU (${cpuSocket}) không khớp socket mainboard (${mainSocket})`;
  }

  if (error.message.startsWith("INCOMPATIBLE_RAM:")) {
    const [, ramType, mainType] = error.message.split(":");
    return `Loại RAM (${ramType}) không khớp mainboard (${mainType})`;
  }

  if (error.message.includes("numeric field overflow") || error.message.includes("22003")) {
    return "Giá bán quá lớn. Tối đa 9.999.999.999 đ, hoặc để trống nếu chưa chốt";
  }

  return "Thao tác thất bại";
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

const redirectKeepingSession = (req: Request, res: Response, url: string): void => {
  req.session.save(() => {
    res.redirect(url);
  });
};

const rememberDraft = (req: Request, configId?: number): void => {
  req.session.bomDraft = bomService.bomFormDraftFromBody(
    req.body as Record<string, unknown>,
    configId,
  );
};

const takeDraft = (req: Request, configId?: number): BomFormDraft | undefined => {
  const draft = req.session.bomDraft;
  if (!draft) {
    return undefined;
  }

  const matches = configId ? draft.configId === configId : !draft.configId;
  if (!matches) {
    return undefined;
  }

  delete req.session.bomDraft;
  return draft;
};

const withDraft = <T extends Record<string, unknown>>(config: T, draft?: BomFormDraft): T => {
  if (!draft) {
    return config;
  }

  return {
    ...config,
    name: draft.name,
    description: draft.description,
    salePrice: draft.salePrice,
    statusDb: draft.status,
    slots: draft.slots,
    extras: draft.extras,
  };
};

const emptyConfig = {
  id: 0,
  name: "",
  code: "Tự tạo khi lưu",
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
  const sort = String(req.query.sort || "").trim();
  const totalConfigs = await bomService.countAllConfigs();

  const objectPagination = {
    currentPage: 1,
    countPage: 1,
    limit: 10,
    skipPage: 0,
  };

  const pagination = paginationHelper(req.query, objectPagination, totalConfigs);
  const rows = await bomService.getAllConfigs(pagination.skipPage, pagination.limit, sort);

  res.render("pages/bom/index", {
    pageTitle: "BOM / Cấu hình PC",
    configs: rows.map(bomService.mapListConfig),
    totalConfigs,
    objectPagination: pagination,
    sort,
  });
};

export const create = async (req: Request, res: Response): Promise<void> => {
  const catalog = await bomService.getComponentOptions();
  const slots = Object.fromEntries(
    (catalog.slots || []).map((slot) => [slot.key, { componentId: "", quantity: slot.defaultQty }]),
  );
  const draft = takeDraft(req);

  res.render("pages/bom/form", {
    pageTitle: "Tạo cấu hình BOM",
    mode: "create",
    formAction: `${BASE()}/create`,
    config: withDraft({ ...emptyConfig, slots }, draft),
    catalog,
  });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await bomService.createConfig(parseBomDto(req));
    delete req.session.bomDraft;
    req.flash("success", "Tạo cấu hình BOM thành công");
    redirectKeepingSession(req, res, `${BASE()}/detail/${config.id}`);
  } catch (error) {
    console.error(error);
    rememberDraft(req);
    req.flash("error", errorMessage(error));
    redirectKeepingSession(req, res, `${BASE()}/create`);
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  try {
    const [row, catalog] = await Promise.all([
      bomService.getConfigById(Number(req.params.id)),
      bomService.getComponentOptions(),
    ]);

    const draft = takeDraft(req, row.id);
    const config = withDraft(bomService.mapDetailConfig(row), draft);

    res.render("pages/bom/form", {
      pageTitle: config.name || row.name,
      mode: "edit",
      formAction: `${BASE()}/detail/${row.id}`,
      config,
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
    delete req.session.bomDraft;
    req.flash("success", "Cập nhật cấu hình BOM thành công");
    redirectKeepingSession(req, res, `${BASE()}/detail/${id}`);
  } catch (error) {
    console.error(error);
    rememberDraft(req, id);
    req.flash("error", errorMessage(error));
    redirectKeepingSession(req, res, `${BASE()}/detail/${id}`);
  }
};
