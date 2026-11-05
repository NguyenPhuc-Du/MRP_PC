import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import type { getDashboardData } from "../services/dashboard.service";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

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

const useFont = (doc: PDFKit.PDFDocument, size: number, bold = false) => {
  const font = resolvePdfFont(bold) || resolvePdfFont(false);
  if (font) {
    doc.font(font).fontSize(size);
    return;
  }
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
};

const stamp = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
};

export const writeDashboardExcel = async (
  res: Response,
  data: DashboardData,
): Promise<void> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Northline PC";
  wb.created = data.exportedAt;

  const summary = wb.addWorksheet("Tong quan", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  summary.columns = [
    { header: "Chỉ số", key: "label", width: 28 },
    { header: "Giá trị", key: "value", width: 18 },
    { header: "Ghi chú", key: "hint", width: 40 },
  ];
  summary.getRow(1).font = { bold: true };
  summary.addRows([
    {
      label: "Tổng linh kiện",
      value: data.metrics.components.value,
      hint: data.metrics.components.hint,
    },
    {
      label: "Giá trị tồn kho",
      value: data.metrics.stockValue.value,
      hint: data.metrics.stockValue.hint,
    },
    {
      label: "Phiếu nhập hôm nay",
      value: data.metrics.importToday.value,
      hint: data.metrics.importToday.hint,
    },
    {
      label: "Xuất chờ duyệt",
      value: data.metrics.exportPending.value,
      hint: data.metrics.exportPending.hint,
    },
    {
      label: "Cấu hình PC",
      value: data.metrics.pcConfigs.value,
      hint: data.metrics.pcConfigs.hint,
    },
    {
      label: "Thành phẩm đã lắp",
      value: data.finished.produced,
      hint: data.metrics.finished.hint,
    },
    {
      label: "Thành phẩm còn kho",
      value: data.finished.onHand,
      hint: `Đã lắp ${data.finished.produced} − đã xuất ${data.finished.shipped}`,
    },
    {
      label: "Đã xuất thành phẩm",
      value: data.finished.shipped,
      hint: `Tháng này: ${data.finished.shippedThisMonth}`,
    },
    {
      label: "Sắp hết / hết hàng",
      value: data.metrics.lowStock.value,
      hint: data.metrics.lowStock.hint,
    },
  ]);

  const alerts = wb.addWorksheet("Canh bao ton", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  alerts.columns = [
    { header: "Linh kiện", key: "name", width: 36 },
    { header: "Chi tiết", key: "meta", width: 36 },
    { header: "Tồn", key: "qty", width: 12 },
  ];
  alerts.getRow(1).font = { bold: true };
  data.alerts.forEach((row) => alerts.addRow(row));
  if (!data.alerts.length) {
    alerts.addRow({ name: "Không có cảnh báo", meta: "", qty: "" });
  }

  const top = wb.addWorksheet("Top linh kien", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  top.columns = [
    { header: "Linh kiện", key: "name", width: 36 },
    { header: "Nhóm", key: "group", width: 18 },
    { header: "Đã dùng", key: "used", width: 12 },
    { header: "Tồn", key: "stock", width: 12 },
    { header: "Trạng thái", key: "stockLabel", width: 14 },
  ];
  top.getRow(1).font = { bold: true };
  data.topItems.forEach((row) =>
    top.addRow({
      name: row.name,
      group: row.group,
      used: row.used,
      stock: row.stock,
      stockLabel: row.stockLabel,
    }),
  );
  if (!data.topItems.length) {
    top.addRow({
      name: "Chưa có dữ liệu",
      group: "",
      used: "",
      stock: "",
      stockLabel: "",
    });
  }

  const activity = wb.addWorksheet("Hoat dong", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  activity.columns = [
    { header: "Loại", key: "title", width: 18 },
    { header: "Chi tiết", key: "detail", width: 70 },
  ];
  activity.getRow(1).font = { bold: true };
  data.activity.forEach((row) =>
    activity.addRow({ title: row.title, detail: row.detail }),
  );

  const filename = `bao-cao-dashboard-${stamp(data.exportedAt)}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  await wb.xlsx.write(res);
  res.end();
};

export const writeDashboardPdf = (
  res: Response,
  data: DashboardData,
): void => {
  const filename = `bao-cao-dashboard-${stamp(data.exportedAt)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: { Title: "Bao cao dashboard Northline PC" },
  });
  doc.pipe(res);

  useFont(doc, 11, true);
  doc.fillColor("#1e1f26").text("NORTHLINE PC", { align: "left" });
  useFont(doc, 16, true);
  doc.text("Báo cáo tổng quan kho");
  useFont(doc, 10);
  doc
    .fillColor("#5b6170")
    .text(data.dateLabel, { lineGap: 4 })
    .text(
      `Xuất lúc ${data.exportedAt.toLocaleString("vi-VN")}`,
      { lineGap: 8 },
    );
  doc.moveDown(0.4);

  useFont(doc, 12, true);
  doc.fillColor("#1e1f26").text("Chỉ số chính");
  doc.moveDown(0.3);
  useFont(doc, 10);
  const metricLines = [
    ["Tổng linh kiện", data.metrics.components.value, data.metrics.components.hint],
    ["Giá trị tồn kho", data.metrics.stockValue.value, data.metrics.stockValue.hint],
    ["Phiếu nhập hôm nay", data.metrics.importToday.value, data.metrics.importToday.hint],
    ["Xuất chờ duyệt", data.metrics.exportPending.value, data.metrics.exportPending.hint],
    ["Cấu hình PC", data.metrics.pcConfigs.value, data.metrics.pcConfigs.hint],
    ["Thành phẩm đã lắp", String(data.finished.produced), data.metrics.finished.hint],
    [
      "Thành phẩm còn kho",
      String(data.finished.onHand),
      `Lắp ${data.finished.produced} · Xuất ${data.finished.shipped}`,
    ],
    ["Sắp hết", data.metrics.lowStock.value, data.metrics.lowStock.hint],
  ] as const;

  metricLines.forEach(([label, value, hint]) => {
    doc.fillColor("#1e1f26").text(`${label}: ${value}`, { continued: false });
    doc.fillColor("#5b6170").text(`  ${hint}`, { lineGap: 2 });
  });

  doc.moveDown(0.8);
  useFont(doc, 12, true);
  doc.fillColor("#1e1f26").text("Cảnh báo tồn kho");
  doc.moveDown(0.3);
  useFont(doc, 10);
  if (!data.alerts.length) {
    doc.fillColor("#5b6170").text("Không có linh kiện dưới ngưỡng.");
  } else {
    data.alerts.forEach((alert, index) => {
      doc
        .fillColor("#1e1f26")
        .text(
          `${index + 1}. ${alert.name} — tồn ${alert.qty} (${alert.meta})`,
          { lineGap: 2 },
        );
    });
  }

  doc.moveDown(0.8);
  useFont(doc, 12, true);
  doc.fillColor("#1e1f26").text("Top linh kiện sử dụng");
  useFont(doc, 9);
  doc.fillColor("#5b6170").text(data.topCaption, { lineGap: 4 });
  useFont(doc, 10);
  if (!data.topItems.length) {
    doc.fillColor("#5b6170").text("Chưa có dữ liệu.");
  } else {
    data.topItems.forEach((item, index) => {
      doc
        .fillColor("#1e1f26")
        .text(
          `${index + 1}. ${item.name} · ${item.group} · dùng ${item.used} · tồn ${item.stock} · ${item.stockLabel}`,
          { lineGap: 2 },
        );
    });
  }

  doc.moveDown(0.8);
  useFont(doc, 12, true);
  doc.fillColor("#1e1f26").text("Hoạt động gần đây");
  doc.moveDown(0.3);
  useFont(doc, 10);
  if (!data.activity.length) {
    doc.fillColor("#5b6170").text("Chưa có hoạt động.");
  } else {
    data.activity.forEach((item) => {
      doc.fillColor("#1e1f26").text(`${item.title}: ${item.detail}`, {
        lineGap: 2,
      });
    });
  }

  doc.end();
};
