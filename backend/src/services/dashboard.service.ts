import { prisma } from "../config/database";

export type DashboardMetric = {
  value: string;
  hint: string;
};

export type DashboardAlert = {
  name: string;
  meta: string;
  qty: number;
};

export type DashboardTopItem = {
  name: string;
  group: string;
  used: number;
  stock: number;
  stockKey: "ok" | "low" | "out";
  stockLabel: string;
};

export type DashboardActivity = {
  title: string;
  detail: string;
  tone: "ok" | "work" | "warn" | "info";
  at: Date;
};

export type DashboardFinishedSummary = {
  onHand: number;
  produced: number;
  shipped: number;
  producedThisMonth: number;
  shippedThisMonth: number;
  activeConfigs: number;
};

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

const shortDate = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
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

const importStatusLabel = (status: string): string => {
  return status === "confirmed" ? "Đã nhập" : "Nháp";
};

const exportStatusLabel = (status: string): string => {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  return "Chờ duyệt";
};

export const getDashboardData = async () => {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const monthStart = startOfMonth(now);
  const overdueBefore = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const chartDays = lastDays(6);
  const chartFrom = chartDays[0];

  const [
    componentCount,
    createdThisMonth,
    inventoryRows,
    importToday,
    importTodayDone,
    exportPending,
    exportOverdue,
    finishedAgg,
    finishedThisMonthAgg,
    finishedShippedAgg,
    finishedShippedThisMonthAgg,
    pcConfigCount,
    importItemsInRange,
    exportItemsInRange,
    exportUsageMonth,
    exportUsageAll,
    productionForUsage,
    recentImports,
    recentExports,
  ] = await Promise.all([
    prisma.component.count({ where: { deleted: false } }),
    prisma.component.count({
      where: { deleted: false, createdAt: { gte: monthStart } },
    }),
    prisma.component.findMany({
      where: { deleted: false },
      include: {
        category: { select: { name: true } },
        inventory: { select: { quantityOnHand: true } },
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
    prisma.exportOrder.count({ where: { status: "pending" } }),
    prisma.exportOrder.count({
      where: { status: "pending", createdAt: { lt: overdueBefore } },
    }),
    prisma.productionOrder.aggregate({
      where: { status: "done" },
      _sum: { quantityRequested: true },
    }),
    prisma.productionOrder.aggregate({
      where: { status: "done", completedAt: { gte: monthStart } },
      _sum: { quantityRequested: true },
    }),
    prisma.exportOrderItem.aggregate({
      where: {
        pcConfigId: { not: null },
        exportOrder: { type: "finished_product", status: "approved" },
      },
      _sum: { quantity: true },
    }),
    prisma.exportOrderItem.aggregate({
      where: {
        pcConfigId: { not: null },
        exportOrder: {
          type: "finished_product",
          status: "approved",
          createdAt: { gte: monthStart },
        },
      },
      _sum: { quantity: true },
    }),
    prisma.pcConfig.count({ where: { status: "active" } }),
    prisma.importOrderItem.findMany({
      where: { importOrder: { createdAt: { gte: chartFrom } } },
      select: {
        quantity: true,
        importOrder: { select: { createdAt: true } },
      },
    }),
    prisma.exportOrderItem.findMany({
      where: {
        exportOrder: { status: "approved", createdAt: { gte: chartFrom } },
      },
      select: {
        quantity: true,
        exportOrder: { select: { createdAt: true } },
      },
    }),
    prisma.exportOrderItem.groupBy({
      by: ["componentId"],
      where: {
        componentId: { not: null },
        exportOrder: {
          status: "approved",
          type: "material",
          createdAt: { gte: monthStart },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.exportOrderItem.groupBy({
      by: ["componentId"],
      where: {
        componentId: { not: null },
        exportOrder: { status: "approved", type: "material" },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.productionOrder.findMany({
      where: { status: { in: ["in_progress", "done"] } },
      select: {
        quantityRequested: true,
        pcConfig: {
          select: {
            bomItems: {
              select: { componentId: true, quantity: true },
            },
          },
        },
      },
    }),
    prisma.importOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        code: true,
        status: true,
        createdAt: true,
        creator: { select: { fullName: true, username: true } },
      },
    }),
    prisma.exportOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        code: true,
        status: true,
        type: true,
        createdAt: true,
        requester: { select: { fullName: true, username: true } },
      },
    }),
  ]);

  const stockRows = inventoryRows.map((row) => ({
    quantityOnHand: row.inventory?.quantityOnHand ?? 0,
    component: row,
  }));

  const stockValue = stockRows.reduce((sum, row) => {
    return sum + row.quantityOnHand * Number(row.component.unitPrice);
  }, 0);

  const lowRows = stockRows
    .filter((row) => row.quantityOnHand <= row.component.minStockThreshold)
    .sort((a, b) => a.quantityOnHand - b.quantityOnHand);

  const criticalCount = lowRows.filter((row) => row.quantityOnHand <= 0).length;
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

  const usageFromExport = exportUsageMonth.some((item) => item.componentId)
    ? exportUsageMonth
    : exportUsageAll;

  const usageFromProduction = new Map<number, number>();
  for (const order of productionForUsage) {
    for (const bom of order.pcConfig.bomItems) {
      const used = bom.quantity * order.quantityRequested;
      usageFromProduction.set(
        bom.componentId,
        (usageFromProduction.get(bom.componentId) ?? 0) + used,
      );
    }
  }

  const usageRanked = [...usageFromProduction.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([componentId, quantity]) => ({
      componentId,
      _sum: { quantity },
    }));

  const usingExports = usageFromExport.some((item) => item.componentId);
  const usageSource = usingExports ? usageFromExport : usageRanked;

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

  const topItems: DashboardTopItem[] = usageSource
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
      };
    })
    .filter((item): item is DashboardTopItem => item !== null);

  const alerts: DashboardAlert[] = lowRows.slice(0, 5).map((row) => ({
    name: row.component.name,
    meta: `${row.component.category?.name ?? "LK"} · Tối thiểu ${row.component.minStockThreshold}`,
    qty: row.quantityOnHand,
  }));

  const actorName = (
    person: { fullName: string | null; username: string } | null | undefined,
  ) => {
    return person?.fullName || person?.username || "Hệ thống";
  };

  const activity: DashboardActivity[] = [
    ...recentImports.map((row) => ({
      title: "Nhập kho",
      detail: `${row.code} · ${importStatusLabel(row.status)} · ${actorName(row.creator)} · ${shortDate(row.createdAt)}`,
      tone: row.status === "confirmed" ? ("ok" as const) : ("info" as const),
      at: row.createdAt,
    })),
    ...recentExports.map((row) => ({
      title: row.type === "finished_product" ? "Xuất thành phẩm" : "Xuất linh kiện",
      detail: `${row.code} · ${exportStatusLabel(row.status)} · ${actorName(row.requester)} · ${shortDate(row.createdAt)}`,
      tone:
        row.status === "pending"
          ? ("warn" as const)
          : row.status === "approved"
            ? ("ok" as const)
            : ("info" as const),
      at: row.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  if (lowRows[0]) {
    const row = lowRows[0];
    activity.unshift({
      title: "Cảnh báo",
      detail: `${row.component.name} còn ${formatInt(row.quantityOnHand)} (tối thiểu ${formatInt(row.component.minStockThreshold)})`,
      tone: "warn",
      at: now,
    });
    activity.splice(6);
  }

  const produced = finishedAgg._sum.quantityRequested ?? 0;
  const shipped = finishedShippedAgg._sum.quantity ?? 0;
  const finishedOnHand = Math.max(0, produced - shipped);
  const finishedThisMonth = finishedThisMonthAgg._sum.quantityRequested ?? 0;
  const shippedThisMonth = finishedShippedThisMonthAgg._sum.quantity ?? 0;

  const finished: DashboardFinishedSummary = {
    onHand: finishedOnHand,
    produced,
    shipped,
    producedThisMonth: finishedThisMonth,
    shippedThisMonth,
    activeConfigs: pcConfigCount,
  };

  let finishedHint = `${formatInt(pcConfigCount)} cấu hình đang bán`;
  if (produced > 0 || shipped > 0) {
    finishedHint = `Còn kho ${formatInt(finishedOnHand)} · đã xuất ${formatInt(shipped)}`;
  } else if (finishedThisMonth > 0) {
    finishedHint = `+${formatInt(finishedThisMonth)} tháng này`;
  } else if (shippedThisMonth > 0) {
    finishedHint = `Xuất ${formatInt(shippedThisMonth)} máy tháng này`;
  }

  const metrics: Record<string, DashboardMetric> = {
    components: {
      value: formatInt(componentCount),
      hint:
        createdThisMonth > 0
          ? `+${formatInt(createdThisMonth)} tháng này`
          : "Không thêm mới tháng này",
    },
    stockValue: {
      value: formatMoneyShort(stockValue),
      hint: "Theo giá nhập × tồn",
    },
    importToday: {
      value: formatInt(importToday).padStart(2, "0"),
      hint:
        importToday > 0
          ? `${formatInt(importTodayDone)} đã xác nhận`
          : "Chưa có phiếu hôm nay",
    },
    exportPending: {
      value: formatInt(exportPending).padStart(2, "0"),
      hint:
        exportOverdue > 0
          ? `${formatInt(exportOverdue)} quá 2 ngày`
          : exportPending > 0
            ? "Chờ duyệt"
            : "Không có phiếu chờ",
    },
    pcConfigs: {
      value: formatInt(pcConfigCount),
      hint: "BOM / cấu hình PC active",
    },
    finished: {
      // Số máy đã lắp xong (production done), không phải tồn thành phẩm sau khi xuất
      value: formatInt(produced),
      hint: finishedHint,
    },
    lowStock: {
      value: formatInt(lowCount + criticalCount).padStart(2, "0"),
      hint: `${formatInt(criticalCount)} hết hàng`,
    },
  };

  const topCaption = usingExports
    ? exportUsageMonth.some((item) => item.componentId)
      ? `Theo phiếu xuất linh kiện đã duyệt, tháng ${now.getMonth() + 1}`
      : "Theo phiếu xuất linh kiện đã duyệt"
    : topItems.length
      ? "Theo BOM của lệnh đang lắp và đã xong"
      : "Chưa có phiếu xuất linh kiện";

  return {
    dateLabel: `${weekdayLabel(now)}, ${dayMonthLabel(now)}`,
    exportedAt: now,
    metrics,
    finished,
    chart: {
      labels: chartDays.map(weekdayShort),
      imports: importSeries,
      exports: exportSeries,
    },
    alerts,
    topItems,
    topCaption,
    activity,
    pcConfigCount,
    summary: {
      componentCount,
      stockValue,
      stockValueLabel: formatMoneyShort(stockValue),
      importToday,
      exportPending,
      lowCount,
      criticalCount,
    },
  };
};
