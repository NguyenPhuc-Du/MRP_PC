import { Request, Response } from "express";
import * as componentService from "../services/components.service";

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
    const countComponents= await componentService.countAllComponents();
    const countPage=Math.ceil(countComponents/10);
    //pagination
    const objectPagination={
      currentPage:1,
      countPage:countPage,
      limit:10,
      skipPage:0,
    };
if(req.query.page){
  objectPagination.currentPage = Math.max(1, Number(req.query.page) || 1);
}
objectPagination.skipPage=(objectPagination.currentPage-1)*objectPagination.limit;
console.log("Check dữ liệu phân trang:");
//end pagination
    console.log("Check dữ liệu phân trang:");
    const rows = await componentService.getAllComponents(objectPagination.skipPage,objectPagination.limit);

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
      objectPagination:objectPagination,
    });
  } catch (error) {
    console.error(error);
    res.render("pages/components/index", {
      pageTitle: "Danh sách linh kiện",
      components: [],
      totalComponents: 0,
      objectPagination: { currentPage: 1, countPage: 1  ,    limit:10,
        skipPage:0, },
    });
  }
};