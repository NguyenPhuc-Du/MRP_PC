import { Request, Response } from "express";

type BomStatus = "draft" | "review" | "approved";

type BomItemView = {
  id: number;
  categoryCode: string;
  categoryName: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

type BomConfigView = {
  id: number;
  name: string;
  code: string;
  version: string;
  subtitle: string;
  description: string;
  status: BomStatus;
  statusLabel: string;
  updatedAt: string;
  items: BomItemView[];
  salePrice: number;
};

const STATUS_LABEL: Record<BomStatus, string> = {
  draft: "Nháp",
  review: "Chờ duyệt",
  approved: "Đã duyệt",
};

const BOM_CONFIGS: BomConfigView[] = [
  {
    id: 1,
    name: "PC Gaming Titan-01",
    code: "BOM-PC-2026-048",
    version: "2.4",
    subtitle: "Cấu hình gaming hiệu năng cao cho dòng sản phẩm Q4",
    description: "Cấu hình tối ưu cho gaming 2K và streaming.",
    status: "approved",
    statusLabel: STATUS_LABEL.approved,
    updatedAt: "17/09/2026",
    salePrice: 60320000,
    items: [
      { id: 1, categoryCode: "CP", categoryName: "CPU", name: "Intel Core i7-14700K", sku: "CPU-I7-14700K", unit: "Cái", quantity: 1, unitPrice: 10490000 },
      { id: 2, categoryCode: "MB", categoryName: "Mainboard", name: "MSI PRO Z790-P WIFI", sku: "MB-Z790-PRO", unit: "Cái", quantity: 1, unitPrice: 5490000 },
      { id: 3, categoryCode: "RA", categoryName: "RAM", name: "Kingston Fury DDR5 32GB", sku: "RAM-DDR5-32G", unit: "Cái", quantity: 2, unitPrice: 2590000 },
      { id: 4, categoryCode: "SS", categoryName: "SSD", name: "WD Black SN770 1TB", sku: "SSD-SN770-1TB", unit: "Cái", quantity: 1, unitPrice: 2190000 },
      { id: 5, categoryCode: "GP", categoryName: "GPU", name: "ASUS Dual RTX 4070 Super", sku: "GPU-RTX4070-S", unit: "Cái", quantity: 1, unitPrice: 18490000 },
      { id: 6, categoryCode: "PS", categoryName: "PSU", name: "Corsair RM850x", sku: "PSU-RM850X", unit: "Cái", quantity: 1, unitPrice: 3290000 },
      { id: 7, categoryCode: "CA", categoryName: "Case", name: "NZXT H7 Flow", sku: "CASE-H7-FLOW", unit: "Cái", quantity: 1, unitPrice: 2490000 },
      { id: 8, categoryCode: "CO", categoryName: "Cooler", name: "DeepCool AK620", sku: "COOL-AK620", unit: "Cái", quantity: 1, unitPrice: 1890000 },
    ],
  },
  {
    id: 2,
    name: "PC Văn phòng",
    code: "BOM-PC-2026-012",
    version: "1.0",
    subtitle: "Cấu hình văn phòng cơ bản",
    description: "Máy văn phòng tiết kiệm điện, đủ dùng cho làm việc.",
    status: "draft",
    statusLabel: STATUS_LABEL.draft,
    updatedAt: "15/09/2026",
    salePrice: 12900000,
    items: [
      { id: 1, categoryCode: "CP", categoryName: "CPU", name: "CPU Intel i5-13400", sku: "CPU-I5-13400", unit: "Cái", quantity: 1, unitPrice: 5200000 },
      { id: 2, categoryCode: "RA", categoryName: "RAM", name: "RAM Kingston Fury 16GB", sku: "RAM-FURY-16G", unit: "Thanh", quantity: 2, unitPrice: 1450000 },
    ],
  },
  {
    id: 3,
    name: "Workstation Pro-12",
    code: "BOM-PC-2026-033",
    version: "1.3",
    subtitle: "Máy trạm dựng hình và render",
    description: "Cấu hình cho thiết kế 3D, edit video và render.",
    status: "review",
    statusLabel: STATUS_LABEL.review,
    updatedAt: "16/09/2026",
    salePrice: 48900000,
    items: [
      { id: 1, categoryCode: "CP", categoryName: "CPU", name: "Intel Core i7-14700K", sku: "CPU-I7-14700K", unit: "Cái", quantity: 1, unitPrice: 10490000 },
      { id: 2, categoryCode: "RA", categoryName: "RAM", name: "Kingston Fury DDR5 32GB", sku: "RAM-DDR5-32G", unit: "Cái", quantity: 2, unitPrice: 2590000 },
      { id: 3, categoryCode: "GP", categoryName: "GPU", name: "ASUS Dual RTX 4070 Super", sku: "GPU-RTX4070-S", unit: "Cái", quantity: 1, unitPrice: 18490000 },
      { id: 4, categoryCode: "SS", categoryName: "SSD", name: "WD Black SN770 1TB", sku: "SSD-SN770-1TB", unit: "Cái", quantity: 1, unitPrice: 2190000 },
    ],
  },
];

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

function withTotals(config: BomConfigView) {
  const itemCount = config.items.reduce((sum, item) => sum + item.quantity, 0);
  const groupCount = new Set(config.items.map((item) => item.categoryCode)).size;
  const totalCost = config.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const margin = config.salePrice > 0
    ? ((config.salePrice - totalCost) / config.salePrice) * 100
    : 0;

  return {
    ...config,
    itemCount,
    groupCount,
    totalCost,
    totalCostText: formatVnd(totalCost),
    salePriceText: formatVnd(config.salePrice),
    marginText: `${margin.toFixed(1).replace(".", ",")}%`,
    items: config.items.map((item) => ({
      ...item,
      unitPriceText: formatVnd(item.unitPrice),
      lineTotalText: formatVnd(item.unitPrice * item.quantity),
    })),
  };
}

export const index = async (_req: Request, res: Response): Promise<void> => {
  const configs = BOM_CONFIGS.map((config) => {
    const view = withTotals(config);
    return {
      id: view.id,
      name: view.name,
      code: view.code,
      version: view.version,
      itemCount: view.itemCount,
      groupCount: view.groupCount,
      totalCostText: view.totalCostText,
      status: view.status,
      statusLabel: view.statusLabel,
      updatedAt: view.updatedAt,
    };
  });

  res.render("pages/bom/index", {
    pageTitle: "BOM / Cấu hình PC",
    configs,
  });
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const config = BOM_CONFIGS.find((item) => item.id === id) ?? BOM_CONFIGS[0];

  res.render("pages/bom/detail", {
    pageTitle: config.name,
    config: withTotals(config),
  });
};
