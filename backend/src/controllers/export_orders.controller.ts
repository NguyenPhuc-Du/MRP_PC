import { Request, Response } from "express";

export const index = async (_req: Request, res: Response): Promise<void> => {
  res.render("pages/exportOrders/index", {
    pageTitle: "Phiếu xuất",
    orders: [
      {
        code: "PX-260915-012",
        partner: "Sản xuất PO-2041",
        date: "15/09/2026",
        creator: "Lê Thanh",
        itemCount: 8,
        total: "486.200.000 đ",
        status: "Đã xuất",
        statusClass: "exported",
      },
      {
        code: "PX-260915-011",
        partner: "Xuất thành phẩm",
        date: "15/09/2026",
        creator: "Ngọc Anh",
        itemCount: 5,
        total: "218.900.000 đ",
        status: "Chờ duyệt",
        statusClass: "waiting",
      },
      {
        code: "PX-260914-039",
        partner: "Sản xuất PO-2041",
        date: "14/09/2026",
        creator: "Lê Thanh",
        itemCount: 12,
        total: "672.500.000 đ",
        status: "Đã duyệt",
        statusClass: "approved",
      },
      {
        code: "PX-260914-038",
        partner: "Xuất thành phẩm",
        date: "14/09/2026",
        creator: "Minh Tuấn",
        itemCount: 4,
        total: "96.800.000 đ",
        status: "Hoàn tất",
        statusClass: "done",
      },
    ],
    processSteps: [
      { label: "Tạo phiếu", state: "done" },
      { label: "Chờ duyệt", state: "done" },
      { label: "Đã duyệt", state: "done" },
      { label: "Đã xuất", state: "todo", number: 4 },
      { label: "Hoàn tất", state: "todo", number: 5 },
    ],
  });
};
