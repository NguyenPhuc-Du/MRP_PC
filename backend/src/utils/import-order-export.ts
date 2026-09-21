import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import { money } from "../services/import-order.service";

type ListRow = {
  code: string;
  createdAtLabel: string;
  creatorName: string;
  supplierName: string;
  itemCount: number;
  totalValue: number;
  totalValueLabel: string;
  statusLabel: string;
};

type DetailOrder = {
  code: string;
  statusLabel: string;
  supplierName: string;
  creatorName: string;
  createdAtLabel: string;
  note: string;
  totalValueLabel: string;
  items: Array<{
    stt: string;
    name: string;
    code: string;
    brand: string;
    supplier: string;
    quantity: number;
    unitPriceLabel: string;
    lineTotalLabel: string;
  }>;
};

const fontRegularCandidates = [
  path.join(process.cwd(), "fonts", "NotoSans-Regular.ttf"),
  "/usr/share/fonts/dejavu/DejaVuSans.ttf",
  "C:\\Windows\\Fonts\\arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
];

const fontBoldCandidates = [
  path.join(process.cwd(), "fonts", "NotoSans-Bold.ttf"),
  "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
  "C:\\Windows\\Fonts\\arialbd.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
];

const resolvePdfFont = (bold = false): string | null => {
  const list = bold ? fontBoldCandidates : fontRegularCandidates;
  return list.find((file) => fs.existsSync(file)) ?? null;
};

export const writeImportOrdersExcel = async (
  res: Response,
  rows: ListRow[],
): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Northline PC";
  const sheet = wb.addWorksheet("Phieu nhap", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Mã", key: "code", width: 22 },
    { header: "Ngày", key: "createdAtLabel", width: 20 },
    { header: "Người tạo", key: "creatorName", width: 22 },
    { header: "NCC", key: "supplierName", width: 22 },
    { header: "SL mặt", key: "itemCount", width: 12 },
    { header: "Tổng tiền", key: "totalValueLabel", width: 18 },
    { header: "Trạng thái", key: "statusLabel", width: 16 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF5B6170" }, size: 11 };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F8" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  rows.forEach((row) => {
    sheet.addRow({
      code: row.code,
      createdAtLabel: row.createdAtLabel,
      creatorName: row.creatorName,
      supplierName: row.supplierName,
      itemCount: row.itemCount,
      totalValueLabel: row.totalValueLabel,
      statusLabel: row.statusLabel,
    });
  });

  sheet.eachRow((row, index) => {
    row.alignment = { vertical: "middle" };
    if (index > 1) {
      row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=phieu-nhap.xlsx",
  );
  await wb.xlsx.write(res);
  res.end();
};

const useFont = (doc: PDFKit.PDFDocument, size: number, bold = false) => {
  const font = resolvePdfFont(bold) || resolvePdfFont(false);
  if (font) {
    doc.font(font).fontSize(size);
    return;
  }
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
};

export const writeImportOrdersPdf = (
  res: Response,
  rows: ListRow[],
  filterLabel: string,
): void => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=phieu-nhap.pdf");

  const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: "Danh sach phieu nhap" } });
  doc.pipe(res);

  useFont(doc, 11, true);
  doc.fillColor("#1e1f26").text("NORTHLINE PC", { align: "left" });
  useFont(doc, 16, true);
  doc.text("Danh sách phiếu nhập kho");
  useFont(doc, 10);
  doc.fillColor("#5b6170").text(filterLabel || "Tất cả phiếu", { lineGap: 6 });
  doc.moveDown(0.6);

  const cols = [
    { x: 40, w: 90, label: "Mã phiếu" },
    { x: 130, w: 70, label: "Ngày" },
    { x: 200, w: 80, label: "Người tạo" },
    { x: 280, w: 80, label: "NCC" },
    { x: 360, w: 40, label: "SL" },
    { x: 400, w: 80, label: "Tổng tiền" },
    { x: 480, w: 75, label: "Trạng thái" },
  ];

  const drawHeader = (y: number) => {
    doc.rect(40, y, 515, 22).fill("#f3f4f8");
    useFont(doc, 8, true);
    doc.fillColor("#98a0b3");
    cols.forEach((col) => {
      doc.text(col.label.toUpperCase(), col.x + 4, y + 7, { width: col.w - 8 });
    });
  };

  let y = doc.y;
  drawHeader(y);
  y += 24;
  useFont(doc, 9);
  doc.fillColor("#1e1f26");

  rows.forEach((row, index) => {
    if (y > 770) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += 24;
      useFont(doc, 9);
      doc.fillColor("#1e1f26");
    }
    if (index % 2 === 1) {
      doc.rect(40, y - 2, 515, 20).fill("#f8f9fd");
    }
    doc.fillColor("#1e1f26");
    const cells = [
      row.code,
      row.createdAtLabel,
      row.creatorName,
      row.supplierName,
      String(row.itemCount),
      row.totalValueLabel,
      row.statusLabel,
    ];
    cols.forEach((col, i) => {
      doc.text(cells[i], col.x + 4, y + 3, {
        width: col.w - 8,
        ellipsis: true,
        align: i >= 4 && i <= 5 ? "right" : "left",
      });
    });
    y += 20;
  });

  useFont(doc, 9, true);
  doc.fillColor("#3b82f6").text(`Tổng: ${rows.length} phiếu`, 40, y + 12);
  doc.end();
};

export const writeImportOrderDetailPdf = (res: Response, order: DetailOrder): void => {
  const filename = `${order.code.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: order.code } });
  doc.pipe(res);

  useFont(doc, 11, true);
  doc.fillColor("#1e1f26").text("NORTHLINE PC");
  useFont(doc, 9);
  doc.fillColor("#8a8d9a").text("ERP  ·  Kho  ·  Sản xuất");
  doc.moveDown(0.4);
  useFont(doc, 18, true);
  doc.fillColor("#1e1f26").text("PHIẾU NHẬP KHO");
  useFont(doc, 12, true);
  doc.text(order.code);
  useFont(doc, 10);
  doc.fillColor("#5b6170");
  doc.text(`Trạng thái: ${order.statusLabel}`);
  doc.text(`Nhà cung cấp: ${order.supplierName}`);
  doc.text(`Người tạo: ${order.creatorName}`);
  doc.text(`Ngày tạo: ${order.createdAtLabel}`);
  if (order.note) {
    doc.text(`Ghi chú: ${order.note}`);
  }
  doc.moveDown(0.8);

  const cols = [
    { x: 40, w: 32, label: "STT" },
    { x: 72, w: 150, label: "Linh kiện" },
    { x: 222, w: 80, label: "Thương hiệu" },
    { x: 302, w: 80, label: "NCC" },
    { x: 382, w: 40, label: "SL" },
    { x: 422, w: 60, label: "Đơn giá" },
    { x: 482, w: 73, label: "Thành tiền" },
  ];

  let y = doc.y;
  doc.rect(40, y, 515, 22).fill("#f3f4f8");
  useFont(doc, 8, true);
  doc.fillColor("#98a0b3");
  cols.forEach((col) => {
    const right = col.label === "SL" || col.label === "Đơn giá" || col.label === "Thành tiền";
    doc.text(col.label.toUpperCase(), col.x + 4, y + 7, {
      width: col.w - 8,
      align: right ? "right" : "left",
    });
  });
  y += 24;

  order.items.forEach((item, index) => {
    if (y > 740) {
      doc.addPage();
      y = 40;
    }
    if (index % 2 === 1) {
      doc.rect(40, y - 2, 515, 36).fill("#f8f9fd");
    }
    useFont(doc, 9);
    doc.fillColor("#1e1f26");
    const values = [
      item.stt,
      `${item.name}\n${item.code}`,
      item.brand,
      item.supplier,
      String(item.quantity),
      item.unitPriceLabel,
      item.lineTotalLabel,
    ];
    cols.forEach((col, i) => {
      const right = i >= 4;
      doc.text(values[i], col.x + 4, y + 4, {
        width: col.w - 8,
        align: right ? "right" : "left",
      });
    });
    y += 36;
  });

  doc.moveTo(40, y).lineTo(555, y).strokeColor("#eceef4").stroke();
  useFont(doc, 11, true);
  doc.fillColor("#1e1f26").text("Tổng", 40, y + 10);
  doc.fillColor("#3b82f6").text(order.totalValueLabel || money(0), 400, y + 10, {
    width: 155,
    align: "right",
  });
  doc.end();
};
