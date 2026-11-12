import { prisma } from "../config/database";

export type ReportGrain = "month" | "quarter" | "year";

export type StockReportRow = {
  name: string;
  meta: string;
  unit: string;
  storedLabel: string;
  exportedLabel: string;
  endingLabel: string;
};

export type StockReportBucket = {
  label: string;
  materialStored: string;
  materialExported: string;
  materialEnding: string;
  productStored: string;
  productExported: string;
  productEnding: string;
};

export type StockReport = {
  grain: ReportGrain;
  year: number;
  month: number;
  quarter: number;
  years: number[];
  months: Array<{ value: number; label: string }>;
  quarters: Array<{ value: number; label: string }>;
  periodLabel: string;
  rangeLabel: string;
  materials: StockReportRow[];
  products: StockReportRow[];
  materialTotals: { stored: string; exported: string; ending: string };
  productTotals: { stored: string; exported: string; ending: string };
  buckets: StockReportBucket[];
};

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const MONTH_LABELS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const formatInt = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

const vnNow = (): { year: number; month: number; quarter: number } => {
  const shifted = new Date(Date.now() + VN_OFFSET_MS);
  const month = shifted.getUTCMonth() + 1;
  return {
    year: shifted.getUTCFullYear(),
    month,
    quarter: Math.floor((month - 1) / 3) + 1,
  };
};

const vnStart = (year: number, month: number, day = 1): Date => {
  return new Date(Date.UTC(year, month - 1, day) - VN_OFFSET_MS);
};

const addMonths = (year: number, month: number, count: number): { year: number; month: number } => {
  const index = year * 12 + (month - 1) + count;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
};

const formatDay = (date: Date): string => {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${shifted.getUTCFullYear()}`;
};

const parseGrain = (value: unknown): ReportGrain => {
  if (value === "quarter" || value === "year" || value === "month") {
    return value;
  }
  return "month";
};

const parseIntIn = (value: unknown, min: number, max: number, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
};

type Window = { start: Date; end: Date; label: string };

const monthWindow = (year: number, month: number): Window => {
  const next = addMonths(year, month, 1);
  const start = vnStart(year, month);
  return {
    start,
    end: vnStart(next.year, next.month),
    label: `${MONTH_LABELS[month - 1]}/${year}`,
  };
};

const quarterWindow = (year: number, quarter: number): Window => {
  const startMonth = (quarter - 1) * 3 + 1;
  const next = addMonths(year, startMonth, 3);
  return {
    start: vnStart(year, startMonth),
    end: vnStart(next.year, next.month),
    label: `Quý ${quarter}/${year}`,
  };
};

const yearWindow = (year: number): Window => {
  return {
    start: vnStart(year, 1),
    end: vnStart(year + 1, 1),
    label: `Năm ${year}`,
  };
};

const windowFor = (
  grain: ReportGrain,
  year: number,
  month: number,
  quarter: number,
): Window => {
  if (grain === "year") return yearWindow(year);
  if (grain === "quarter") return quarterWindow(year, quarter);
  return monthWindow(year, month);
};

const subWindows = (
  grain: ReportGrain,
  year: number,
  month: number,
  quarter: number,
): Window[] => {
  if (grain === "year") {
    return [1, 2, 3, 4].map((item) => quarterWindow(year, item));
  }
  if (grain === "quarter") {
    const startMonth = (quarter - 1) * 3 + 1;
    return [0, 1, 2].map((offset) => {
      const next = addMonths(year, startMonth, offset);
      return monthWindow(next.year, next.month);
    });
  }
  return [];
};

type Flow = { at: Date; qty: number };

const sumBetween = (flows: Flow[], start: Date, end: Date): number => {
  return flows.reduce((sum, flow) => {
    if (flow.at >= start && flow.at < end) {
      return sum + flow.qty;
    }
    return sum;
  }, 0);
};

const sumFrom = (flows: Flow[], end: Date): number => {
  return flows.reduce((sum, flow) => (flow.at >= end ? sum + flow.qty : sum), 0);
};

const endingAt = (onHand: number, inbound: Flow[], outbound: Flow[], end: Date): number => {
  return onHand - sumFrom(inbound, end) + sumFrom(outbound, end);
};

const addFlow = (map: Map<number, Flow[]>, id: number, at: Date, qty: number): void => {
  const list = map.get(id) ?? [];
  list.push({ at, qty });
  map.set(id, list);
};

const rowOf = (
  name: string,
  meta: string,
  unit: string,
  stored: number,
  exported: number,
  ending: number,
): StockReportRow | null => {
  if (stored === 0 && exported === 0 && ending === 0) {
    return null;
  }
  return {
    name,
    meta,
    unit,
    storedLabel: formatInt(stored),
    exportedLabel: formatInt(exported),
    endingLabel: formatInt(ending),
  };
};

export const getStockReport = async (
  query: Record<string, unknown>,
): Promise<StockReport> => {
  const now = vnNow();
  const grain = parseGrain(query.grain);
  const year = parseIntIn(query.year, 2020, now.year + 1, now.year);
  const month = parseIntIn(query.month, 1, 12, now.month);
  const quarter = parseIntIn(query.quarter, 1, 4, now.quarter);
  const period = windowFor(grain, year, month, quarter);
  const buckets = subWindows(grain, year, month, quarter);

  const [components, configs, imports, exports, productions] = await Promise.all([
    prisma.component.findMany({
      select: {
        id: true,
        name: true,
        unit: true,
        deleted: true,
        category: { select: { name: true } },
        inventory: { select: { quantityOnHand: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.pcConfig.findMany({
      select: {
        id: true,
        name: true,
        productInventory: { select: { quantityOnHand: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.importOrder.findMany({
      where: { status: "confirmed" },
      select: {
        createdAt: true,
        items: { select: { componentId: true, quantity: true } },
      },
    }),
    prisma.exportOrder.findMany({
      select: {
        type: true,
        status: true,
        note: true,
        createdAt: true,
        approvedAt: true,
        items: { select: { componentId: true, pcConfigId: true, quantity: true } },
      },
    }),
    prisma.productionOrder.findMany({
      where: { status: "done", deletedAt: null, completedAt: { not: null } },
      select: {
        id: true,
        pcConfigId: true,
        quantityRequested: true,
        completedAt: true,
        pcConfig: {
          select: { bomItems: { select: { componentId: true, quantity: true } } },
        },
      },
    }),
  ]);

  const materialIn = new Map<number, Flow[]>();
  const materialExport = new Map<number, Flow[]>();
  const materialLeave = new Map<number, Flow[]>();
  const productIn = new Map<number, Flow[]>();
  const productOut = new Map<number, Flow[]>();

  for (const order of imports) {
    for (const item of order.items) {
      addFlow(materialIn, item.componentId, order.createdAt, item.quantity);
    }
  }

  const latestPoExport = new Map<number, (typeof exports)[number]>();
  for (const order of exports) {
    const at = order.approvedAt ?? order.createdAt;
    if (order.status === "approved" && order.type === "material") {
      for (const item of order.items) {
        if (item.componentId == null) continue;
        addFlow(materialExport, item.componentId, at, item.quantity);
        addFlow(materialLeave, item.componentId, at, item.quantity);
      }
    }
    if (order.status === "approved" && order.type === "finished_product") {
      for (const item of order.items) {
        if (item.pcConfigId == null) continue;
        addFlow(productOut, item.pcConfigId, at, item.quantity);
      }
    }
    if (order.type !== "material" || !order.note) continue;
    const match = order.note.match(/^PO#(\d+)/);
    if (!match) continue;
    const orderId = Number(match[1]);
    const current = latestPoExport.get(orderId);
    if (!current || order.createdAt > current.createdAt) {
      latestPoExport.set(orderId, order);
    }
  }

  for (const order of productions) {
    if (!order.completedAt) continue;
    addFlow(productIn, order.pcConfigId, order.completedAt, order.quantityRequested);

    const slip = latestPoExport.get(order.id);
    const issued = new Map<number, number>();
    if (slip?.status === "approved") {
      for (const item of slip.items) {
        if (item.componentId == null) continue;
        issued.set(item.componentId, (issued.get(item.componentId) ?? 0) + item.quantity);
      }
    }
    for (const bom of order.pcConfig.bomItems) {
      const remain = bom.quantity * order.quantityRequested - (issued.get(bom.componentId) ?? 0);
      if (remain > 0) {
        addFlow(materialLeave, bom.componentId, order.completedAt, remain);
      }
    }
  }

  const materials: StockReportRow[] = [];
  let materialStored = 0;
  let materialExported = 0;
  let materialEnding = 0;

  for (const component of components) {
    const inbound = materialIn.get(component.id) ?? [];
    const exportedFlows = materialExport.get(component.id) ?? [];
    const leave = materialLeave.get(component.id) ?? [];
    const stored = sumBetween(inbound, period.start, period.end);
    const exported = sumBetween(exportedFlows, period.start, period.end);
    const ending = endingAt(
      component.inventory?.quantityOnHand ?? 0,
      inbound,
      leave,
      period.end,
    );
    const row = rowOf(
      component.name,
      component.deleted ? `${component.category.name} · đã xóa` : component.category.name,
      component.unit || "cái",
      stored,
      exported,
      ending,
    );
    if (!row) continue;
    materials.push(row);
    materialStored += stored;
    materialExported += exported;
    materialEnding += ending;
  }

  const products: StockReportRow[] = [];
  let productStored = 0;
  let productExported = 0;
  let productEnding = 0;

  for (const config of configs) {
    const inbound = productIn.get(config.id) ?? [];
    const outbound = productOut.get(config.id) ?? [];
    const stored = sumBetween(inbound, period.start, period.end);
    const exported = sumBetween(outbound, period.start, period.end);
    const ending = endingAt(
      config.productInventory?.quantityOnHand ?? 0,
      inbound,
      outbound,
      period.end,
    );
    const row = rowOf(config.name, `BOM-PC-${String(config.id).padStart(3, "0")}`, "bộ", stored, exported, ending);
    if (!row) continue;
    products.push(row);
    productStored += stored;
    productExported += exported;
    productEnding += ending;
  }

  const sumMap = (map: Map<number, Flow[]>, start: Date, end: Date): number => {
    let total = 0;
    for (const flows of map.values()) {
      total += sumBetween(flows, start, end);
    }
    return total;
  };

  const endingMap = (
    ids: Array<{ id: number; onHand: number }>,
    inbound: Map<number, Flow[]>,
    outbound: Map<number, Flow[]>,
    end: Date,
  ): number => {
    return ids.reduce((sum, item) => {
      return sum + endingAt(item.onHand, inbound.get(item.id) ?? [], outbound.get(item.id) ?? [], end);
    }, 0);
  };

  const componentHands = components.map((component) => ({
    id: component.id,
    onHand: component.inventory?.quantityOnHand ?? 0,
  }));
  const productHands = configs.map((config) => ({
    id: config.id,
    onHand: config.productInventory?.quantityOnHand ?? 0,
  }));

  const lastDay = new Date(period.end.getTime() - 1);

  return {
    grain,
    year,
    month,
    quarter,
    years: Array.from({ length: now.year - 2024 + 1 }, (_, index) => now.year - index),
    months: MONTH_LABELS.map((label, index) => ({ value: index + 1, label })),
    quarters: [1, 2, 3, 4].map((value) => ({
      value,
      label: `Quý ${value}`,
    })),
    periodLabel: period.label,
    rangeLabel: `${formatDay(period.start)} – ${formatDay(lastDay)}`,
    materials,
    products,
    materialTotals: {
      stored: formatInt(materialStored),
      exported: formatInt(materialExported),
      ending: formatInt(materialEnding),
    },
    productTotals: {
      stored: formatInt(productStored),
      exported: formatInt(productExported),
      ending: formatInt(productEnding),
    },
    buckets: buckets.map((bucket) => ({
      label: bucket.label,
      materialStored: formatInt(sumMap(materialIn, bucket.start, bucket.end)),
      materialExported: formatInt(sumMap(materialExport, bucket.start, bucket.end)),
      materialEnding: formatInt(endingMap(componentHands, materialIn, materialLeave, bucket.end)),
      productStored: formatInt(sumMap(productIn, bucket.start, bucket.end)),
      productExported: formatInt(sumMap(productOut, bucket.start, bucket.end)),
      productEnding: formatInt(endingMap(productHands, productIn, productOut, bucket.end)),
    })),
  };
};
