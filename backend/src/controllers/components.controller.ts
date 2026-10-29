import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { randomUUID } from "crypto";
import path from "path";
import * as componentService from "../services/components.service";
import { paginationHelper } from "../utils/pagination.utils";
import { formsearchHelper } from "../utils/formsearch.utils";
import { systemConfig } from "../config/system";
import { redisClient } from "../config/redis";
import { uploadPublicImage, componentImageKey, R2_COMPONENT_FOLDERS } from "../config/r2";
import {
  COMPONENT_UNITS,
  DEFAULT_COMPONENT_UNIT,
} from "../constants/component-units";

type StockStatusKey = "ok" | "low" | "out";
type ListStatus = "all" | "active" | "discontinued" | "out_of_stock";

const LIST_STATUSES = new Set<ListStatus>([
  "all",
  "active",
  "discontinued",
  "out_of_stock",
]);
const listUrl = () => `${systemConfig.prefixAdmin}/components`;

const parseListStatus = (value: unknown): ListStatus => {
  const status = String(value ?? "all");
  return LIST_STATUSES.has(status as ListStatus)
    ? (status as ListStatus)
    : "all";
};

const optionalFkId = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const categoryFolderOf = (categoryName?: string | null): string => {
  if (!categoryName) {
    return "CPU";
  }
  const match = R2_COMPONENT_FOLDERS.find(
    (folder) => folder.toLowerCase() === categoryName.trim().toLowerCase(),
  );
  return match ?? "CPU";
};

const stockStatusOf = (
  quantityOnHand: number,
  minStockThreshold: number,
  componentStatus: string,
): { key: StockStatusKey; label: string } => {
  if (componentStatus === "discontinued") {
    return { key: "out", label: "Ngừng KD" };
  }
  if (quantityOnHand <= 0) {
    return { key: "out", label: "Hết hàng" };
  }
  if (quantityOnHand <= minStockThreshold) {
    return { key: "low", label: "Sắp hết" };
  }
  return { key: "ok", label: "Còn hàng" };
};

const formatVnd = (value: unknown): string => {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "—";
  }
  return `${amount.toLocaleString("vi-VN")} đ`;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectSearch = formsearchHelper(req.query);
    const status = parseListStatus(req.query.status);
    const countComponents = await componentService.countAllComponents(
      objectSearch.keyword,
      status,
    );

    const objectPagination = {
      currentPage: 1,
      countPage: 1,
      limit: 10,
      skipPage: 0,
    };
    const pagination = paginationHelper(
      req.query,
      objectPagination,
      countComponents,
    );
    const rows = await componentService.getAllComponents(
      pagination.skipPage,
      pagination.limit,
      objectSearch.keyword,
      status,
    );

    const components = rows.map((row) => {
      const quantityOnHand = row.inventory?.quantityOnHand ?? 0;
      const stock = stockStatusOf(
        quantityOnHand,
        row.minStockThreshold,
        row.status,
      );

      return {
        id: row.id,
        code: `${(row.category?.name ?? "LK").toUpperCase()}-${row.id}`,
        name: row.name,
        imageUrl: row.imageUrl,
        category: row.category?.name ?? "—",
        unit: row.unit ?? "—",
        quantityOnHand,
        minStockThreshold: row.minStockThreshold,
        unitPrice: formatVnd(row.unitPrice),
        stockStatus: stock.key,
        stockLabel: stock.label,
        createdAt: row.createdAt,
      };
    });

    res.render("pages/components/index", {
      pageTitle: "Danh sách linh kiện",
      components,
      totalComponents: countComponents,
      objectPagination: pagination,
      keyword: objectSearch.keyword,
      status,
    });
  } catch (error) {
    console.error(error);
    res.render("pages/components/index", {
      pageTitle: "Danh sách linh kiện",
      components: [],
      totalComponents: 0,
      objectPagination: {
        currentPage: 1,
        countPage: 1,
        limit: 10,
        skipPage: 0,
      },
      keyword: "",
      status: "all",
    });
  }
};

export const deleteComponent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (req.params.id) {
      await componentService.deleteComponent(Number(req.params.id));
      req.flash("success", "Xoá linh kiện thành công");
    }
    res.redirect(listUrl());
  } catch (error) {
    console.error(error);
    req.flash("error", "Xoá linh kiện thất bại");
    res.redirect(listUrl());
  }
};

export const editComponent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.redirect(listUrl());
      return;
    }

    const [row, lookups] = await Promise.all([
      componentService.getComponentById(id),
      componentService.getComponentEditLookups(),
    ]);

    if (!row || row.deleted) {
      res.redirect(listUrl());
      return;
    }

    const quantityOnHand = row.inventory?.quantityOnHand ?? 0;
    const stock = stockStatusOf(
      quantityOnHand,
      row.minStockThreshold,
      row.status,
    );

    res.render("pages/components/edit", {
      pageTitle: "Sửa linh kiện",
      component: {
        id: row.id,
        code: `${(row.category?.name ?? "LK").toUpperCase()}-${row.id}`,
        name: row.name,
        unit: row.unit ?? "",
        unitPrice: Number(row.unitPrice),
        minStockThreshold: row.minStockThreshold,
        imageUrl: row.imageUrl ?? "",
        categoryId: row.categoryId,
        brandId: row.brandId,
        supplierId: row.supplierId,
        status: row.status,
        quantityOnHand,
        stockStatus: stock.key,
        stockLabel: stock.label,
        attributes: row.attributes.map((item) => ({
          name: item.attributeDefinition.name,
          value: item.value,
          unit: item.attributeDefinition.unit ?? "",
        })),
      },
      categories: lookups.categories,
      brands: lookups.brands,
      suppliers: lookups.suppliers,
      units: [...COMPONENT_UNITS],
    });
  } catch (error) {
    console.error(error);
    res.redirect(listUrl());
  }
};

export const editComponentPatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);
  const redirectList = listUrl();

  if (!Number.isInteger(id) || id <= 0) {
    res.redirect(redirectList);
    return;
  }

  try {
    const existing = await componentService.getComponentById(id);
    if (!existing || existing.deleted) {
      req.flash("error", "Không tìm thấy linh kiện");
      res.redirect(redirectList);
      return;
    }

    const data = matchedData(req, { locations: ["body"] });
    const lookups = await componentService.getComponentEditLookups();
    const categoryId = Number(data.categoryId);
    const category = lookups.categories.find((item) => item.id === categoryId);

    let imageUrl = "";
    const file = req.file;
    if (file) {
      const folder = categoryFolderOf(category?.name);
      const ext = path.extname(file.originalname) || ".jpg";
      const key = componentImageKey(folder, `${id}-${Date.now()}${ext}`);
      imageUrl = await uploadPublicImage(key, file.buffer, file.mimetype);
    }

    await componentService.updateComponent(id, {
      name: data.name,
      unit: data.unit || DEFAULT_COMPONENT_UNIT,
      unitPrice: data.unitPrice,
      minStockThreshold: data.minStockThreshold ?? existing.minStockThreshold,
      status: data.status || existing.status,
      categoryId,
      brandId: optionalFkId(data.brandId),
      supplierId: optionalFkId(data.supplierId),
      ...(imageUrl ? { imageUrl } : {}),
    });

    req.flash("success", "Cập nhật linh kiện thành công");
    res.redirect(redirectList);
  } catch (error) {
    console.error(error);
    req.flash("error", "Cập nhật linh kiện thất bại");
    res.redirect(redirectList);
  }
};

export const createComponent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const lookups = await componentService.getComponentEditLookups();
    res.render("pages/components/create", {
      pageTitle: "Thêm linh kiện",
      categories: lookups.categories,
      brands: lookups.brands,
      suppliers: lookups.suppliers,
      units: [...COMPONENT_UNITS],
      defaultUnit: DEFAULT_COMPONENT_UNIT,
      idempotencyKey: randomUUID(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Không tải được form thêm linh kiện");
    res.redirect(listUrl());
  }
};

export const createComponentPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const redirectList = listUrl();
  const createUrl = `${redirectList}/create`;
  const data = matchedData(req, { locations: ["body"] });
  const idempotencyKey = String(data.idempotencyKey || "").trim();
  const redisKey = `mrp:idem:component:create:${idempotencyKey}`;

  try {
    const locked = await redisClient.set(redisKey, "1", {
      NX: true,
      EX: 60 * 10,
    });
    if (locked === null) {
      req.flash("error", "Yêu cầu đã được xử lý hoặc đang xử lý");
      res.redirect(redirectList);
      return;
    }

    const lookups = await componentService.getComponentEditLookups();
    const categoryId = Number(data.categoryId);
    const category = lookups.categories.find((item) => item.id === categoryId);

    const created = await componentService.createComponent({
      name: data.name,
      unit: data.unit || DEFAULT_COMPONENT_UNIT,
      unitPrice: data.unitPrice,
      minStockThreshold: data.minStockThreshold ?? 5,
      status: data.status || "active",
      categoryId,
      brandId: optionalFkId(data.brandId),
      supplierId: optionalFkId(data.supplierId),
    });

    const file = req.file;
    if (file) {
      const folder = categoryFolderOf(category?.name);
      const ext = path.extname(file.originalname) || ".jpg";
      const key = componentImageKey(folder, `${created.id}-${Date.now()}${ext}`);
      const imageUrl = await uploadPublicImage(key, file.buffer, file.mimetype);
      await componentService.updateComponent(created.id, { imageUrl });
    }

    req.flash("success", "Thêm linh kiện thành công");
    res.redirect(redirectList);
  } catch (error) {
    console.error(error);
    try {
      await redisClient.del(redisKey);
    } catch (redisError) {
      console.error(redisError);
    }
    req.flash("error", "Thêm linh kiện thất bại");
    res.redirect(createUrl);
  }
};
