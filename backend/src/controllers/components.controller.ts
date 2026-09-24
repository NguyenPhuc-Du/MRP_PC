import { Request, Response } from "express";
import * as componentService from "../services/components.service";
import { paginationHelper } from '../utils/pagination.utils';
import { formsearchHelper } from '../utils/formsearch.utils';
import { systemConfig } from "../config/system";
import path from "path";
import { uploadPublicImage, componentImageKey, R2_COMPONENT_FOLDERS } from "../config/r2";
type StockStatusKey = "ok" | "low" | "out"; //định dạng type mặc định chỉ được đưa 3 gt này vô

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
};//định dạng return của hàm stockStatusOf là 1 object có 2 thuộc tính key và label

const formatVnd = (value: unknown): string => { //khôg biết giá trị của value là gì nên dùng unknown nhưng đầu ra bắt buộc là string
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "—";
  }
  return `${amount.toLocaleString("vi-VN")} đ`;
};

export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectSearch = formsearchHelper(req.query);
    const countComponents = await componentService.countAllComponents(
      objectSearch.keyword,
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
    const status = req.query.status || "all";
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
      components:components,
      totalComponents: countComponents,
      objectPagination:pagination,
      keyword: objectSearch.keyword,
      status:status
    });
  } catch (error) {
    console.error(error);
    res.render("pages/components/index", {
      pageTitle: "Danh sách linh kiện",
      components: [],
      totalComponents: 0,
      objectPagination: { currentPage: 1, countPage: 1  ,    limit:10,
        skipPage:0, },
        keyword: "",
    });
  }
};
export const deleteComponent = async (req: Request, res: Response): Promise<void> => {
try{
if(req.params.id){
  const component= await componentService.deleteComponent(Number(req.params.id));
  req.flash("success", "Xoá linh kiện thành công");
  res.redirect(req.get("referer") );
}
}
catch(error){
  req.flash("error", "Xoá linh kiện thất bại");
  res.send("NO");
}
};
export const editComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.redirect(`${systemConfig.prefixAdmin}/components`);
      return;
    }

    const [row, lookups] = await Promise.all([
      componentService.getComponentById(id),
      componentService.getComponentEditLookups(),
    ]);

    if (!row || row.deleted) {
      res.redirect(`${systemConfig.prefixAdmin}/components`);
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
    });
  } catch (error) {
    console.error(error);
    res.redirect(`${systemConfig.prefixAdmin}/components`);
  }
};
export const editComponentPatch = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const listUrl = `${systemConfig.prefixAdmin}/components`;


  if (!Number.isInteger(id) || id <= 0) {
    res.redirect(listUrl);
    return;
  }

  try {
    const existing = await componentService.getComponentById(id);
    if (!existing || existing.deleted) {
      req.flash("error", "Không tìm thấy linh kiện");
      res.redirect(listUrl);
      return;
    }

    const lookups = await componentService.getComponentEditLookups();
    const categoryId = Number(req.body.categoryId);
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
      name: req.body.name,
      unit: req.body.unit,
      unitPrice: req.body.unitPrice,
      minStockThreshold: Number(req.body.minStockThreshold),
      status: req.body.status,
      categoryId,
      brandId: optionalFkId(req.body.brandId),
      supplierId: optionalFkId(req.body.supplierId),
      ...(imageUrl ? { imageUrl } : {}),
    });

    req.flash("success", "Cập nhật linh kiện thành công");
    res.redirect(listUrl);
  } catch (error) {
    console.error(error);
    req.flash("error", "Cập nhật linh kiện thất bại");
    res.redirect(listUrl);
  }
};
export const createComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const lookups = await componentService.getComponentEditLookups();
    res.render("pages/components/create", {
      pageTitle: "Thêm linh kiện",
      categories: lookups.categories,
      brands: lookups.brands,
      suppliers: lookups.suppliers,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Không tải được form thêm linh kiện");
    res.redirect(`${systemConfig.prefixAdmin}/components`);
  }
};

export const createComponentPost = async (req: Request, res: Response): Promise<void> => {
  const listUrl = `${systemConfig.prefixAdmin}/components`;
  const createUrl = `${listUrl}/create`;

  try {
    const lookups = await componentService.getComponentEditLookups();
    const categoryId = Number(req.body.categoryId);
    const category = lookups.categories.find((item) => item.id === categoryId);

    const created = await componentService.createComponent({
      name: req.body.name,
      unit: req.body.unit || null,
      unitPrice: req.body.unitPrice,
      minStockThreshold: Number(req.body.minStockThreshold) || 5,
      status: req.body.status || "active",
      categoryId,
      brandId: optionalFkId(req.body.brandId),
      supplierId: optionalFkId(req.body.supplierId),
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
    res.redirect(listUrl);
  } catch (error) {
    console.error(error);
    req.flash("error", "Thêm linh kiện thất bại");
    res.redirect(createUrl);
  }
};