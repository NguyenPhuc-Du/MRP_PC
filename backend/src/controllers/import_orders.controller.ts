import { Request, Response } from "express";

export const index = async (_req: Request, res: Response): Promise<void> => {
  res.render("pages/importOders/index", {
    pageTitle: "Phiếu nhập",
    orders: [
      {
        code: "PN-260915-012",
        partner: "Digiworld",
        date: "15/09/2026",
        creator: "Lê Thanh",
        itemCount: 8,
        total: "486.200.000 đ",
        status: "Hoàn tất",
        statusClass: "done",
      },
      {
        code: "PN-260915-011",
        partner: "Synnex FPT",
        date: "15/09/2026",
        creator: "Ngọc Anh",
        itemCount: 5,
        total: "218.900.000 đ",
        status: "Chờ duyệt",
        statusClass: "waiting",
      },
      {
        code: "PN-260914-039",
        partner: "Vĩnh Xuân",
        date: "14/09/2026",
        creator: "Lê Thanh",
        itemCount: 12,
        total: "672.500.000 đ",
        status: "Đã duyệt",
        statusClass: "approved",
      },
      {
        code: "PN-260914-038",
        partner: "KTC",
        date: "14/09/2026",
        creator: "Minh Tuấn",
        itemCount: 4,
        total: "96.800.000 đ",
        status: "Nháp",
        statusClass: "draft",
      },
    ],
    processSteps: [
      { label: "Nháp", state: "done" },
      { label: "Chờ duyệt", state: "done" },
      { label: "Đã duyệt", state: "done" },
      { label: "Hoàn tất", state: "todo", number: 4 },
    ],
  });
};
