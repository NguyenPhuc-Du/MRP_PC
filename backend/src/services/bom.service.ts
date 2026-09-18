import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma";
import { BomItemInput, CreateBomDto, UpdateBomDto } from "../dtos/bom.dto";

const bomInclude = {
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

type BomConfigRow = Prisma.PcConfigGetPayload<{ include: typeof bomInclude }>;

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

export const getAllConfigs = async (): Promise<BomConfigRow[]> => {
  return prisma.pcConfig.findMany({
    include: bomInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getConfigById = async (id: number): Promise<BomConfigRow> => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("BOM_NOT_FOUND");
  }

  const config = await prisma.pcConfig.findUnique({
    where: { id },
    include: bomInclude,
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
    version: "1.0",
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

  const used = new Set<number>();
  const slots: Record<string, { componentId: number | ""; quantity: number }> = {};

  for (const slot of REQUIRED_SLOTS) {
    const found = items.find(
      (item) => !used.has(item.componentId) && slot.categories.includes(item.categoryName),
    );
    if (found) {
      used.add(found.componentId);
      slots[slot.key] = { componentId: found.componentId, quantity: found.quantity };
    } else {
      slots[slot.key] = { componentId: "", quantity: slot.defaultQty };
    }
  }

  return {
    id: config.id,
    name: config.name,
    code: `BOM-PC-${String(config.id).padStart(3, "0")}`,
    version: "1.0",
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
    extras: items.filter((item) => !used.has(item.componentId)),
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

  if (normalized.length === 0) {
    throw new Error("NO_ITEMS");
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
    select: { id: true, status: true, category: { select: { name: true } } },
  });

  if (components.length !== ids.length) {
    throw new Error("COMPONENT_NOT_FOUND");
  }

  if (components.some((component) => component.status !== "active")) {
    throw new Error("COMPONENT_INACTIVE");
  }

  const byId = new Map(components.map((component) => [component.id, component]));

  for (const slot of REQUIRED_SLOTS) {
    const hasSlot = normalized.some((item) => {
      const categoryName = byId.get(item.componentId)?.category.name;
      return categoryName ? slot.categories.includes(categoryName) : false;
    });
    if (!hasSlot) {
      throw new Error("MISSING_REQUIRED_SLOT");
    }
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
  const salePrice = dto.salePrice && dto.salePrice > 0 ? dto.salePrice : 0;

  return prisma.pcConfig.create({
    data: {
      name,
      description: dto.description?.trim() || null,
      salePrice,
      status: dto.status ?? "active",
      bomItems: {
        create: items,
      },
    },
    include: bomInclude,
  });
};

export const updateConfig = async (id: number, dto: UpdateBomDto): Promise<BomConfigRow> => {
  await getConfigById(id);

  const name = dto.name?.trim();
  if (name !== undefined && !name) {
    throw new Error("NAME_REQUIRED");
  }
  if (dto.salePrice !== undefined && dto.salePrice < 0) {
    throw new Error("INVALID_PRICE");
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
        ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(items ? { bomItems: { create: items } } : {}),
      },
      include: bomInclude,
    });
  });
};
