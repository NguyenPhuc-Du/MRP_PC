import { prisma } from "../config/database";

export type DashboardMetric = {
  value: string;
  hint: string;
  mock: boolean;
};

export type DashboardAlert = {
  name: string;
  meta: string;
  qty: number;
  mock: boolean;
};

export type DashboardTopItem = {
  name: string;
  group: string;
  used: number;
  stock: number;
  stockKey: "ok" | "low" | "out";
  stockLabel: string;
  mock: boolean;
};

export type DashboardActivity = {
  title: string;
  detail: string;
  tone: "ok" | "work" | "warn" | "info";
  mock: boolean;
};

const MOCK_CHART = {
  labels: ["T4", "T5", "T6", "T7", "T8", "T9"],
  imports: [180, 220, 160, 240, 200, 280],
  exports: [80, 90, 70, 100, 85, 110],
};

const MOCK_ALERTS: DashboardAlert[] = [
  { name: "ASUS Dual RTX 4070 Super", meta: "GPU · Tối thiểu 20", qty: 14, mock: true },
  { name: "WD Black SN770 NVMe 1TB", meta: "SSD · Tối thiểu 18", qty: 12, mock: true },
  { name: "Corsair RM850x 80+ Gold", meta: "PSU · Tối thiểu 10", qty: 9, mock: true },
];

const MOCK_TOP: DashboardTopItem[] = [
  { name: "Intel Core i7-14700K", group: "CPU", used: 163, stock: 128, stockKey: "ok", stockLabel: "Còn hàng", mock: true },
  { name: "ASUS Dual RTX 4070 Super", group: "GPU", used: 83, stock: 14, stockKey: "low", stockLabel: "Sắp hết", mock: true },
  { name: "Kingston Fury DDR5 32GB", group: "RAM", used: 243, stock: 216, stockKey: "ok", stockLabel: "Còn hàng", mock: true },
  { name: "WD Black SN770 NVMe 1TB", group: "SSD", used: 163, stock: 12, stockKey: "low", stockLabel: "Sắp hết", mock: true },
  { name: "Corsair RM850x 80+ Gold", group: "PSU", used: 133, stock: 0, stockKey: "out", stockLabel: "Hết hàng", mock: true },
];

const MOCK_ACTIVITY: DashboardActivity[] = [
  { title: "Nhập kho", detail: "PN-260915-012 đã hoàn tất", tone: "ok", mock: true },
  { title: "Sản xuất", detail: "PO-2041 bắt đầu lắp ráp", tone: "work", mock: true },
  { title: "Cảnh báo", detail: "SSD SN770 dưới ngưỡng", tone: "warn", mock: true },
  { title: "BOM", detail: "PC Creator v3 đã duyệt", tone: "info", mock: true },
];

const weekdayLabel = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", { weekday: "long" }).toUpperCase();
};

const dayMonthLabel = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
};

const weekdayShort = (date: Date): string => {
  const map = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return map[date.getDay()] ?? "T2";
};

const startOfDay = (date: Date): Date => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const formatInt = (value: number): string => {
  return value.toLocaleString("vi-VN");
};

const formatMoneyShort = (value: number): string => {
  if (value >= 1_000_000_000) {
    const ty = value / 1_000_000_000;
    return `${ty.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  }
  if (value >= 1_000_000) {
    const trieu = value / 1_000_000;
    return `${trieu.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }
  return `${value.toLocaleString("vi-VN")} đ`;
};

const stockOf = (qty: number, min: number) => {
  if (qty <= 0) {
    return { key: "out" as const, label: "Hết hàng" };
  }
  if (qty <= min) {
    return { key: "low" as const, label: "Sắp hết" };
  }
  return { key: "ok" as const, label: "Còn hàng" };
};

const lastDays = (count: number): Date[] => {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (count - 1 - index));
    return day;
  });
};

export const getDashboardData = async () => {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const monthStart = startOfMonth(now);
  const chartDays = lastDays(6);
  const chartFrom = chartDays[0];

  const [
    componentCount,
    createdThisMonth,
    inventoryRows,
    importToday,
    importTodayDone,
    importTotal,
    exportPending,
    exportTotal,
    productionTotal,
    productionInProgress,
    productionPending,
    pcConfigCount,
    importItemsInRange,
    exportItemsInRange,
    exportUsage,
    bomUsage,
    auditRows,
  ] = await Promise.all([
    prisma.component.count({ where: { deleted: false } }),
    prisma.component.count({
      where: { deleted: false, createdAt: { gte: monthStart } },
    }),
    prisma.inventory.findMany({
      where: { component: { deleted: false } },
      include: {
        component: {
          include: { category: { select: { name: true } } },
        },
      },
    }),
    prisma.importOrder.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.importOrder.count({
      where: {
        status: "confirmed",
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.importOrder.count(),
    prisma.exportOrder.count({ where: { status: "pending" } }),
    prisma.exportOrder.count(),
    prisma.productionOrder.count(),
    prisma.productionOrder.count({ where: { status: "in_progress" } }),
    prisma.productionOrder.count({ where: { status: "pending" } }),
    prisma.pcConfig.count(),
    prisma.importOrderItem.findMany({
      where: { importOrder: { createdAt: { gte: chartFrom } } },
      select: {
        quantity: true,
        importOrder: { select: { createdAt: true } },
      },
    }),
    prisma.exportOrderItem.findMany({
      where: { exportOrder: { createdAt: { gte: chartFrom } } },
      select: {
        quantity: true,
        exportOrder: { select: { createdAt: true } },
      },
    }),
    prisma.exportOrderItem.groupBy({
      by: ["componentId"],
      where: {
        componentId: { not: null },
        exportOrder: { createdAt: { gte: monthStart } },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.bomItem.groupBy({
      by: ["componentId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { account: { select: { fullName: true, username: true } } },
    }),
  ]);

  const stockValue = inventoryRows.reduce((sum, row) => {
    return sum + row.quantityOnHand * Number(row.component.unitPrice);
  }, 0);

  const lowRows = inventoryRows
    .filter((row) => row.quantityOnHand <= row.component.minStockThreshold)
    .sort((a, b) => a.quantityOnHand - b.quantityOnHand);

  const criticalCount = inventoryRows.filter((row) => row.quantityOnHand <= 0).length;
  const lowCount = lowRows.filter((row) => row.quantityOnHand > 0).length;

  const qtyByDay = (rows: { quantity: number; at: Date }[]) => {
    return chartDays.map((day) => {
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      return rows
        .filter((row) => row.at >= day && row.at < next)
        .reduce((sum, row) => sum + row.quantity, 0);
    });
  };

  const importSeries = qtyByDay(
    importItemsInRange.map((item) => ({
      quantity: item.quantity,
      at: item.importOrder.createdAt,
    })),
  );
  const exportSeries = qtyByDay(
    exportItemsInRange.map((item) => ({
      quantity: item.quantity,
      at: item.exportOrder.createdAt,
    })),
  );
  const chartEmpty = [...importSeries, ...exportSeries].every((value) => value === 0);

  const usageSource = exportUsage.some((item) => item.componentId)
    ? exportUsage
    : bomUsage;
  const usageIds = usageSource
    .map((item) => item.componentId)
    .filter((id): id is number => typeof id === "number");

  const usageComponents =
    usageIds.length > 0
      ? await prisma.component.findMany({
          where: { id: { in: usageIds }, deleted: false },
          include: {
            category: { select: { name: true } },
            inventory: { select: { quantityOnHand: true } },
          },
        })
      : [];

  const topReal: DashboardTopItem[] = usageSource
    .map((item) => {
      const component = usageComponents.find((row) => row.id === item.componentId);
      if (!component) {
        return null;
      }
      const qty = component.inventory?.quantityOnHand ?? 0;
      const stock = stockOf(qty, component.minStockThreshold);
      return {
        name: component.name,
        group: component.category?.name ?? "—",
        used: item._sum.quantity ?? 0,
        stock: qty,
        stockKey: stock.key,
        stockLabel: stock.label,
        mock: false,
      };
    })
    .filter((item): item is DashboardTopItem => item !== null);

  const alertsReal: DashboardAlert[] = lowRows.slice(0, 5).map((row) => ({
    name: row.component.name,
    meta: `${row.component.category?.name ?? "LK"} · Tối thiểu ${row.component.minStockThreshold}`,
    qty: row.quantityOnHand,
    mock: false,
  }));

  const activityReal: DashboardActivity[] = auditRows.map((row) => ({
    title: row.action,
    detail: `${row.account.fullName || row.account.username}${row.detail ? ` · ${row.detail}` : ""}`,
    tone: "info",
    mock: false,
  }));

  const metrics: Record<string, DashboardMetric> = {
    components: {
      value: formatInt(componentCount),
      hint: `+${formatInt(createdThisMonth)} tháng này`,
      mock: false,
    },
    stockValue: {
      value: formatMoneyShort(stockValue),
      hint: "Theo giá nhập × tồn",
      mock: false,
    },
    importToday: importTotal > 0
      ? {
          value: formatInt(importToday).padStart(2, "0"),
          hint: `${formatInt(importTodayDone)} hoàn tất`,
          mock: false,
        }
      : { value: "12", hint: "8 hoàn tất", mock: true },
    exportPending: exportTotal > 0
      ? {
          value: formatInt(exportPending).padStart(2, "0"),
          hint: "Chờ duyệt",
          mock: false,
        }
      : { value: "07", hint: "3 quá hạn", mock: true },
    production: productionTotal > 0
      ? {
          value: formatInt(productionPending + productionInProgress),
          hint: `${formatInt(productionInProgress)} đang lắp`,
          mock: false,
        }
      : { value: "24", hint: "+6 tháng này", mock: true },
    assembling: productionInProgress > 0
      ? {
          value: formatInt(productionInProgress),
          hint: "Lệnh đang lắp",
          mock: false,
        }
      : { value: "42", hint: "64% tiến độ", mock: true },
    finished: {
      value: "318",
      hint: "+8,4%",
      mock: true,
    },
    lowStock: {
      value: formatInt(lowCount).padStart(2, "0"),
      hint: `${formatInt(criticalCount)} nghiêm trọng`,
      mock: false,
    },
  };

  return {
    dateLabel: `${weekdayLabel(now)}, ${dayMonthLabel(now)}`,
    metrics,
    chart: {
      labels: chartEmpty ? MOCK_CHART.labels : chartDays.map(weekdayShort),
      imports: chartEmpty ? MOCK_CHART.imports : importSeries,
      exports: chartEmpty ? MOCK_CHART.exports : exportSeries,
      mock: chartEmpty,
    },
    alerts: alertsReal.length ? alertsReal : MOCK_ALERTS,
    alertsMock: alertsReal.length === 0,
    topItems: topReal.length ? topReal : MOCK_TOP,
    topMock: topReal.length === 0,
    topCaption: topReal.length && exportUsage.some((item) => item.componentId)
      ? `Theo phiếu xuất tháng ${now.getMonth() + 1}`
      : topReal.length
        ? "Theo số lượng trong BOM"
        : "Theo lệnh sản xuất tháng này",
    activity: activityReal.length ? activityReal : MOCK_ACTIVITY,
    activityMock: activityReal.length === 0,
    pcConfigCount,
  };
};
