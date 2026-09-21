import { Request, Response } from "express";
import { systemConfig } from "../config/system";
import { ImportOrderItemInput } from "../dtos/import-order.dto";
import * as importOrderService from "../services/import-order.service";

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

export const index = async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q || "");
  const status = String(req.query.status || "");
  const createdBy = Number(req.query.createdBy || 0);
  const from = String(req.query.from || "");
  const to = String(req.query.to || "");
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);

  const [list, stats, accounts, shortages] = await Promise.all([
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
    importOrderService.getShortageComponents(),
  ]);

  res.render("pages/importOders/index", {
    pageTitle: "Phiếu nhập kho",
    ...list,
    stats,
    accounts,
    shortages,
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
    // const creator = await importOrderService.getDefaultCreator();
    // const order = await importOrderService.createOrder({
    //   createdBy: creator.id,
    //   code: String(req.body.code || ""),
    //   note: String(req.body.note || ""),
    //   items: parseItems(req.body),
    // });
    const accountId = req.session.account?.id;
    if (!accountId) {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
      return;
    }
    const supplierId = Number(req.body.supplierId);
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      req.flash("error", "Chọn nhà cung cấp");
      res.redirect(`${BASE()}/create`);
      return;
    }

    const order = await importOrderService.createOrder({
      createdBy: accountId,
      supplierId,
      code: String(req.body.code || ""),
      note: String(req.body.note || ""),
      items: parseItems(req.body),
    });

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
  const orderId = Number(req.params.orderId);
  try {
    // const creator = await importOrderService.getDefaultCreator();
    // await importOrderService.confirmOrder(orderId, creator.id);
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
    await importOrderService.upsertSupplierByName(String(req.body.name || ""));
    req.flash("success", "Đã thêm nhà cung cấp");
  } catch (error) {
    console.error(error);
    req.flash("error", errorMessage(error));
  }
  res.redirect(returnTo);
};
