import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { ImportOrderFilter, ImportOrderItemInput } from "../dtos/import-order.dto";
import * as importOrderService from "../services/import-order.service";
import {
  writeImportOrderDetailPdf,
  writeImportOrdersExcel,
  writeImportOrdersPdf,
} from "../utils/import-order-export";

const BASE = () => `${systemConfig.prefixAdmin}/importOrders`;

const errorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Có lỗi xảy ra";
  }
  switch (error.message) {
    case "NO_ITEMS":
      return "Thêm ít nhất một linh kiện vào phiếu";
    case "NOT_FOUND":
      return "Không tìm thấy phiếu nhập";
    case "NOT_DRAFT":
      return "Chỉ sửa được phiếu đang ở trạng thái nháp";
    case "ALREADY_CONFIRMED":
      return "Phiếu này đã được xác nhận";
    case "INVALID_QTY":
      return "Số lượng linh kiện phải lớn hơn 0 trước khi xác nhận";
    case "NO_ACCOUNT":
      return "Chưa có tài khoản trong hệ thống để tạo phiếu";
    case "NO_SUPPLIER_NAME":
      return "Nhập tên nhà cung cấp";
    case "NO_BRAND_NAME":
      return "Nhập tên thương hiệu";
    default:
      return "Thao tác thất bại";
  }
};

const parseItems = (body: Request["body"]): ImportOrderItemInput[] => {
  const raw = body.items;
  if (!raw) {
    return [];
  }

  const rows = Array.isArray(raw) ? raw : Object.values(raw);
  return rows.map((row) => {
    const item = row as Record<string, string>;
    return {
      componentId: Number(item.componentId),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    };
  });
};

const listFilterFromQuery = (query: Request["query"]): ImportOrderFilter => {
  const createdBy = Number(query.createdBy || 0);
  return {
    q: String(query.q || ""),
    status: String(query.status || "") as ImportOrderFilter["status"],
    createdBy: createdBy || undefined,
    from: String(query.from || "") || undefined,
    to: String(query.to || "") || undefined,
  };
};

const exportFilterLabel = (filter: ImportOrderFilter): string => {
  const parts = ["Bộ lọc hiện tại"];
  if (filter.q) parts.push(`mã: ${filter.q}`);
  if (filter.status) parts.push(`trạng thái: ${filter.status}`);
  if (filter.from || filter.to) {
    parts.push(`ngày: ${filter.from || "…"} → ${filter.to || "…"}`);
  }
  return parts.join(" · ");
};

export const index = async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q || "");
  const status = String(req.query.status || "");
  const createdBy = Number(req.query.createdBy || 0);
  const from = String(req.query.from || "");
  const to = String(req.query.to || "");
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);

  const [list, stats, accounts, shortageGroups] = await Promise.all([
    importOrderService.listOrders({
      q,
      status: status as "draft" | "confirmed" | "",
      createdBy: createdBy || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      limit,
    }),
    importOrderService.getStats(),
    importOrderService.getAccounts(),
    importOrderService.getShortageGroups(),
  ]);

  res.render("pages/importOders/index", {
    pageTitle: "Phiếu nhập kho",
    ...list,
    stats,
    accounts,
    shortageGroups,
    filters: { q, status, createdBy: createdBy || "", from, to, limit },
  });
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const account = req.session.account;
    if (!account) {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }

    const ids = String(req.query.ids || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    const [suppliers, brands, components, initialItems, code] =
      await Promise.all([
        importOrderService.getSuppliers(),
        importOrderService.getBrands(),
        importOrderService.getComponentOptions(),
        importOrderService.getPrefillItemsByIds(ids),
        importOrderService.generateCode(),
      ]);

    res.render("pages/importOders/form", {
      pageTitle: "Tạo phiếu nhập kho",
      mode: "create",
      code,
      creator: account,
      suppliers,
      brands,
      components,
      order: null,
      initialItems,
      suggestedSupplierId: Number(req.query.supplierId || 0) || null,
      addedSupplierId: Number(req.query.addedSupplier || 0) || null,
      addedBrandId: Number(req.query.addedBrand || 0) || null,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(BASE());
  }
};

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1) Chặn role: middleware requireWarehouse đã chạy trước
    // 2) Người tạo = session, không getDefaultCreator()
    const createdBy = req.session.account?.id;
    if (!createdBy) {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }

    // 3) NCC bắt buộc — dữ liệu bảng suppliers
    const supplierId = Number(req.body.supplierId);
    if (!supplierId) {
      req.flash("error", "Chọn nhà cung cấp");
      res.redirect(`${BASE()}/create`);
      return;
    }

    // 4) items[] từ form — componentId lấy từ DB picker, không id cứng
    const items = parseItems(req.body);

    // 5) Service: status draft, chưa cộng kho
    const order = await importOrderService.createOrder({
      createdBy,
      supplierId,
      note: String(req.body.note || ""),
      items,
      code: String(req.body.code || ""),
    });

    // 6) intent=draft → list; không thì sang detail để xác nhận
    const intent = String(req.body.intent || "create");
    req.flash(
      "success",
      intent === "draft" ? "Đã lưu phiếu nháp" : "Tạo phiếu nhập thành công",
    );
    if (intent === "draft") {
      res.redirect(BASE());
      return;
    }
    res.redirect(`${BASE()}/${order.id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(`${BASE()}/create`);
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  try {
    const order = await importOrderService.getOrderById(orderId);
    if (!order) {
      req.flash("error", "Không tìm thấy phiếu nhập");
      res.redirect(BASE());
      return;
    }

    res.render("pages/importOders/detail", {
      pageTitle: order.code,
      order: await importOrderService.mapDetailOrder(order),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(BASE());
  }
};

export const edit = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  try {
    const order = await importOrderService.getOrderById(orderId);
    if (!order) {
      req.flash("error", "Không tìm thấy phiếu nhập");
      res.redirect(BASE());
      return;
    }
    if (order.status !== "draft") {
      req.flash("error", "Chỉ sửa được phiếu đang ở trạng thái nháp");
      res.redirect(`${BASE()}/${orderId}`);
      return;
    }

    const [components, suppliers, brands] = await Promise.all([
      importOrderService.getComponentOptions(),
      importOrderService.getSuppliers(),
      importOrderService.getBrands(),
    ]);
    res.render("pages/importOders/form", {
      pageTitle: `Sửa ${order.code}`,
      mode: "edit",
      code: order.code,
      creator: order.creator,
      suppliers,
      brands,
      components,
      order: await importOrderService.mapDetailOrder(order),
      addedSupplierId: Number(req.query.addedSupplier || 0) || null,
      addedBrandId: Number(req.query.addedBrand || 0) || null,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(BASE());
  }
};

export const editPost = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  try {
    const accountId = req.session.account?.id;
    if (!accountId) {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }
    const supplierId = Number(req.body.supplierId);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      req.flash("error", "Chọn nhà cung cấp");
      res.redirect(`${BASE()}/${orderId}/edit`);
      return;
    }
    await importOrderService.updateDraft(orderId, {
      createdBy: accountId,
      supplierId,
      note: String(req.body.note || ""),
      items: parseItems(req.body),
    });

    const intent = String(req.body.intent || "create");
    req.flash("success", "Đã cập nhật phiếu nhập");
    if (intent === "draft") {
      res.redirect(`${BASE()}/${orderId}/edit`);
      return;
    }
    res.redirect(`${BASE()}/${orderId}`);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(`${BASE()}/${orderId}/edit`);
  }
};

export const confirm = async (req: Request, res: Response): Promise<void> => {
  // Chỉ QL kho tới đây (requireWarehouse). Phiếu phải đang draft, SL > 0, rồi inventory.increment.
  const orderId = Number(req.params.orderId);
  try {
    const accountId = req.session.account?.id;
    if (!accountId) {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }
    await importOrderService.confirmOrder(orderId, accountId);

    req.flash("success", "Đã xác nhận phiếu nhập và cập nhật tồn kho");
    res.redirect(`${BASE()}/${orderId}`);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(`${BASE()}/${orderId}`);
  }
};

export const exportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = listFilterFromQuery(req.query);
    const rows = await importOrderService.listOrdersForExport(filter);
    await writeImportOrdersExcel(res, rows);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(BASE());
  }
};

export const exportPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = listFilterFromQuery(req.query);
    const rows = await importOrderService.listOrdersForExport(filter);
    writeImportOrdersPdf(res, rows, exportFilterLabel(filter));
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(BASE());
  }
};

export const exportOrderPdf = async (req: Request, res: Response): Promise<void> => {
  const orderId = Number(req.params.orderId);
  try {
    const found = await importOrderService.getOrderById(orderId);
    if (!found) {
      req.flash("error", "Không tìm thấy phiếu nhập");
      res.redirect(BASE());
      return;
    }
    const order = await importOrderService.mapDetailOrder(found);
    writeImportOrderDetailPdf(res, order);
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
    res.redirect(BASE());
  }
};
export const createSupplierPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const fallback = `${BASE()}/create`;
  const rawReturnTo = String(req.body.returnTo || fallback);
  const returnTo = rawReturnTo.startsWith(`${systemConfig.prefixAdmin}/importOrders`)
    ? rawReturnTo
    : fallback;
  try {
    const created = await importOrderService.upsertSupplierByName(
      String(req.body.name || ""),
    );
    req.flash("success", "Đã thêm nhà cung cấp");
    const joiner = returnTo.includes("?") ? "&" : "?";
    res.redirect(`${returnTo}${joiner}addedSupplier=${created.id}`);
    return;
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
  }
  res.redirect(returnTo);
};

export const createBrandPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const fallback = `${BASE()}/create`;
  const rawReturnTo = String(req.body.returnTo || fallback);
  const returnTo = rawReturnTo.startsWith(`${systemConfig.prefixAdmin}/importOrders`)
    ? rawReturnTo
    : fallback;
  try {
    const created = await importOrderService.upsertBrandByName(
      String(req.body.name || ""),
    );
    req.flash("success", "Đã thêm thương hiệu");
    const joiner = returnTo.includes("?") ? "&" : "?";
    res.redirect(`${returnTo}${joiner}addedBrand=${created.id}`);
    return;
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
  }
  res.redirect(returnTo);
};
