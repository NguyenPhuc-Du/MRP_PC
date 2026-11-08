import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma";

import { BomItemInput, CreateBomDto, UpdateBomDto } from "../dtos/bom.dto";

const bomSelect = {
  id: true,
  name: true,
  description: true,
  salePrice: true,
  status: true,
  createdAt: true,
  bomItems: {
    include: {
      component: {
        select: {
          id: true,
          name: true,
          unit: true,
          unitPrice: true,
          status: true,
          category: { select: { name: true } },
        },
      },
    },
  },
} as const;

type BomConfigRow = Prisma.PcConfigGetPayload<{ select: typeof bomSelect }>;

const SUGGESTED_MARGIN = 0.15;

export const REQUIRED_SLOTS = [
  { key: "cpu", label: "CPU", categories: ["CPU"], defaultQty: 1 },
  { key: "main", label: "Mainboard", categories: ["Mainboard"], defaultQty: 1 },
  { key: "ram", label: "RAM", categories: ["Ram", "RAM"], defaultQty: 2 },
  { key: "storage", label: "Ổ cứng", categories: ["SSD", "HDD"], defaultQty: 1 },
  { key: "psu", label: "Nguồn", categories: ["PSU"], defaultQty: 1 },
  { key: "cooler", label: "Tản nhiệt", categories: ["Fan"], defaultQty: 1 },
  { key: "case", label: "Case", categories: ["Case"], defaultQty: 1 },
] as const;

export type BomFormDraft = {
  configId?: number;
  name: string;
  description: string;
  salePrice: string;
  status: "active" | "inactive";
  slots: Record<string, { componentId: string; quantity: number }>;
  extras: Array<{ componentId: number; quantity: number }>;
};

export const bomFormDraftFromBody = (
  body: Record<string, unknown>,
  configId?: number,
): BomFormDraft => {
  const slotsRaw =
    body.slots && typeof body.slots === "object"
      ? (body.slots as Record<string, { componentId?: string; quantity?: string }>)
      : {};
  const slots: BomFormDraft["slots"] = {};

  for (const slot of REQUIRED_SLOTS) {
    const row = slotsRaw[slot.key] || {};
    const quantity = Number(row.quantity || slot.defaultQty);
    slots[slot.key] = {
      componentId: String(row.componentId || ""),
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : slot.defaultQty,
    };
  }

  const extrasRaw = body.extras;
  const rows = !extrasRaw
    ? []
    : Array.isArray(extrasRaw)
      ? extrasRaw
      : Object.values(extrasRaw as Record<string, unknown>);

  const extras = rows
    .map((row) => {
      const item = row as { componentId?: string; quantity?: string };
      return {
        componentId: Number(item.componentId),
        quantity: Number(item.quantity || 1),
      };
    })
    .filter((item) => Number.isInteger(item.componentId) && item.componentId > 0);

  return {
    configId,
    name: String(body.name || ""),
    description: String(body.description || ""),
    salePrice:
      body.salePrice === undefined || body.salePrice === null || body.salePrice === ""
        ? ""
        : String(body.salePrice),
    status: body.status === "inactive" ? "inactive" : "active",
    slots,
    extras,
  };
};

const EXTRA_CATEGORIES = ["GPU", "SSD", "HDD", "Fan", "Ram", "RAM"];

const CATEGORY_CODE: Record<string, string> = {
  CPU: "CP",
  Mainboard: "MB",
  RAM: "RA",
  Ram: "RA",
  GPU: "GP",
  PSU: "PS",
  SSD: "SS",
  HDD: "HD",
  Case: "CA",
  Fan: "FA",
};

const toNumber = (value: Prisma.Decimal | number | string): number => Number(value);

const formatVnd = (value: number): string => {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
};

const formatDate = (value: Date): string => {
  return value.toLocaleDateString("vi-VN");
};

const categoryCodeOf = (categoryName: string): string => {
  return CATEGORY_CODE[categoryName] ?? categoryName.slice(0, 2).toUpperCase();
};

const skuOf = (categoryName: string, id: number): string => {
  const prefix = (categoryName || "COM").replace(/\s+/g, "").slice(0, 3).toUpperCase();
  return `${prefix}-${String(id).padStart(3, "0")}`;
};

const totalsOf = (config: BomConfigRow) => {
  const itemCount = config.bomItems.reduce((sum, item) => sum + item.quantity, 0);
  const groupCount = new Set(
    config.bomItems.map((item) => item.component.category.name),
  ).size;
  const totalCost = config.bomItems.reduce(
    (sum, item) => sum + item.quantity * toNumber(item.component.unitPrice),
    0,
  );
  const salePrice = toNumber(config.salePrice);
  const suggestedSale = Math.round(totalCost / (1 - SUGGESTED_MARGIN));
  const marginBase = salePrice > 0 ? salePrice : suggestedSale;
  const margin = marginBase > 0 ? ((marginBase - totalCost) / marginBase) * 100 : 0;

  return { itemCount, groupCount, totalCost, salePrice, suggestedSale, margin };
};

export const getAllConfigs = async (skip : number, take: number, sort?: string): Promise<BomConfigRow[]> => {
  const orderBy = sort === "price_asc"
   ? { salePrice: "asc" as const} 
   : sort === "price_desc" 
      ? { salePrice: "desc" as const} 
      : { createdAt: "desc" as const};
  
  return prisma.pcConfig.findMany({
    skip: skip,
    take: take,
    select: bomSelect,
    orderBy,
  });
};

export const countAllConfigs = async () => {
  return await prisma.pcConfig.count();
};


export const getConfigById = async (id: number): Promise<BomConfigRow> => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("BOM_NOT_FOUND");
  }

  const config = await prisma.pcConfig.findUnique({
    where: { id },
    select: bomSelect,
  });

  if (!config) {
    throw new Error("BOM_NOT_FOUND");
  }

  return config;
};

export const mapListConfig = (config: BomConfigRow) => {
  const { itemCount, groupCount, totalCost, salePrice } = totalsOf(config);
  const isActive = config.status === "active";

  return {
    id: config.id,
    name: config.name,
    code: `BOM-PC-${String(config.id).padStart(3, "0")}`,
    itemCount,
    groupCount,
    totalCostText: formatVnd(totalCost),
    salePriceText: salePrice > 0 ? formatVnd(salePrice) : "Chưa chốt",
    saleLocked: salePrice > 0,
    status: isActive ? "approved" : "draft",
    statusLabel: isActive ? "Hoạt động" : "Ngưng",
    updatedAt: formatDate(config.createdAt),
  };
};

export const mapDetailConfig = (config: BomConfigRow) => {
  const { itemCount, groupCount, totalCost, salePrice, suggestedSale, margin } = totalsOf(config);
  const isActive = config.status === "active";
  const items = config.bomItems.map((item) => {
    const unitPrice = toNumber(item.component.unitPrice);
    const categoryName = item.component.category.name;

    return {
      id: item.id,
      componentId: item.component.id,
      categoryCode: categoryCodeOf(categoryName),
      categoryName,
      name: item.component.name,
      sku: skuOf(categoryName, item.component.id),
      unit: item.component.unit || "cái",
      quantity: item.quantity,
      unitPrice,
      unitPriceText: formatVnd(unitPrice),
      lineTotalText: formatVnd(unitPrice * item.quantity),
    };
  });

  const ordered = [...items].sort((a, b) => a.id - b.id);
  const used = new Set<number>();
  const slots: Record<string, { componentId: number | ""; quantity: number }> = {};

  REQUIRED_SLOTS.forEach((slot, index) => {
    const found = ordered[index];
    if (found) {
      used.add(found.id);
      slots[slot.key] = { componentId: found.componentId, quantity: found.quantity };
    } else {
      slots[slot.key] = { componentId: "", quantity: slot.defaultQty };
    }
  });

  return {
    id: config.id,
    name: config.name,
    code: `BOM-PC-${String(config.id).padStart(3, "0")}`,
    subtitle: config.description || "Công thức lắp ráp từ danh mục linh kiện.",
    description: config.description || "",
    status: isActive ? "approved" : "draft",
    statusDb: config.status,
    statusLabel: isActive ? "Hoạt động" : "Ngưng",
    salePrice: salePrice > 0 ? salePrice : "",
    itemCount,
    groupCount,
    totalCost,
    totalCostText: formatVnd(totalCost),
    suggestedSale,
    suggestedSaleText: formatVnd(suggestedSale),
    salePriceText: salePrice > 0 ? formatVnd(salePrice) : "Chưa chốt",
    marginText: `${margin.toFixed(1).replace(".", ",")}%`,
    items,
    slots,
    extras: ordered.filter((item) => !used.has(item.id)),
  };
};

const normalizeItems = (items: BomItemInput[]): BomItemInput[] => {
  return items
    .map((item) => ({
      componentId: Number(item.componentId),
      quantity: Number(item.quantity),
    }))
    .filter((item) => Number.isInteger(item.componentId) && item.componentId > 0);
};

const validateItems = async (items: BomItemInput[]): Promise<BomItemInput[]> => {
  const normalized = normalizeItems(items);

  if (normalized.length < REQUIRED_SLOTS.length) {
    throw new Error("NOT_ENOUGH_COMPONENTS");
  }

  if (normalized.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new Error("INVALID_QTY");
  }

  const ids = normalized.map((item) => item.componentId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("DUPLICATE_COMPONENT");
  }

  const components = await prisma.component.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      status: true,
    },
  });

  if (components.length !== ids.length) {
    throw new Error("COMPONENT_NOT_FOUND");
  }

  if (components.some((component) => component.status !== "active")) {
    throw new Error("COMPONENT_INACTIVE");
  }

  return normalized;
};

export const getComponentOptions = async () => {
  const rows = await prisma.component.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      unit: true,
      unitPrice: true,
      category: { select: { name: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  const all = rows.map((row) => ({
    id: row.id,
    name: row.name,
    unit: row.unit || "cái",
    unitPrice: toNumber(row.unitPrice),
    category: row.category.name,
  }));

  const grouped: Record<string, typeof all> = {};
  for (const slot of REQUIRED_SLOTS) {
    grouped[slot.key] = all.filter((item) => slot.categories.includes(item.category));
  }
  grouped.extra = all.filter((item) => EXTRA_CATEGORIES.includes(item.category));

  return {
    all,
    grouped,
    slots: REQUIRED_SLOTS.map((slot) => ({
      key: slot.key,
      label: slot.label,
      categories: [...slot.categories],
      defaultQty: slot.defaultQty,
    })),
  };
};

export const createConfig = async (dto: CreateBomDto): Promise<BomConfigRow> => {
  const name = dto.name.trim();
  if (!name) {
    throw new Error("NAME_REQUIRED");
  }

  const items = await validateItems(dto.items);

  return prisma.pcConfig.create({
    data: {
      name,
      description: dto.description?.trim() || null,
      salePrice: 0,
      status: dto.status ?? "active",
      bomItems: {
        create: items,
      },
    },
    select: bomSelect,
  });
};

export const updateConfig = async (id: number, dto: UpdateBomDto): Promise<BomConfigRow> => {
  await getConfigById(id);

  const name = dto.name?.trim();
  if (name !== undefined && !name) {
    throw new Error("NAME_REQUIRED");
  }

  const items = dto.items ? await validateItems(dto.items) : undefined;

  return prisma.$transaction(async (tx) => {
    if (items) {
      await tx.bomItem.deleteMany({ where: { pcConfigId: id } });
    }

    return tx.pcConfig.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(items ? { bomItems: { create: items } } : {}),
      },
      select: bomSelect,
    });
  });
};
