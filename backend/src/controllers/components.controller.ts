import { Request, Response } from "express";
import * as componentService from "../services/components.service";
import { paginationHelper } from '../utils/pagination.utils';
import { formsearchHelper } from '../utils/formsearch.utils';

type StockStatusKey = "ok" | "low" | "out"; //định dạng type mặc định chỉ được đưa 3 gt này vô

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

    const rows = await componentService.getAllComponents(
      pagination.skipPage,
      pagination.limit,
      objectSearch.keyword,
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
  res.redirect(req.get("referer") );
}
}
catch(error){
  res.send("NO");
}
};