import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma";
import {
  ImportOrderFilter,
  ImportOrderItemInput,
  SaveImportOrderDto,
} from "../dtos/import-order.dto";

const componentSelect = {
  id: true,
  name: true,
  unit: true,
  unitPrice: true,
  category: { select: { name: true } },
  brand: { select: { name: true } },
  supplier: { select: { name: true } },
  inventory: { select: { quantityOnHand: true } },
} as const;

const orderInclude = {
  creator: true,
  supplier: true,
  items: {
    include: {
      component: {
        select: componentSelect,
      },
    },
  },
} as const;

export const money = (value: number): string => {
  return `₫${Math.round(value).toLocaleString("vi-VN")}`;
};

export const formatDateTime = (
  value: Date | string | null | undefined,
): string => {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const componentCode = (categoryName: string, id: number): string => {
  const prefix = (categoryName || "COM")
    .replace(/\s+/g, "")
    .slice(0, 3)
    .toUpperCase();
  return `COMP-${prefix}-${String(id).padStart(3, "0")}`;
};

const toNumber = (value: Prisma.Decimal | number | string): number =>
  Number(value);

const totalsFromItems = (
  items: { quantity: number; unitPrice: Prisma.Decimal | number }[],
) => {
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * toNumber(item.unitPrice),
    0,
  );
  return { itemCount, totalQty, totalValue };
};

type OrderWithRelations = Prisma.ImportOrderGetPayload<{
  include: {
    creator: true;
    supplier: true;
    items: {
      include: {
        component: {
          select: {
            id: true;
            name: true;
            unit: true;
            unitPrice: true;
            category: { select: { name: true } };
            brand: { select: { name: true } };
            supplier: { select: { name: true } };
            inventory: { select: { quantityOnHand: true } };
          };
        };
      };
    };
  };
}>;

export const mapListOrder = (order: OrderWithRelations) => {
  const { itemCount, totalQty, totalValue } = totalsFromItems(order.items);
  return {
    id: order.id,
    code: order.code,
    note: order.note || "",
    status: order.status,
    supplierName: order.supplier?.name ?? "—",
    statusLabel: order.status === "confirmed" ? "Đã xác nhận" : "Nháp",
    createdAtLabel: formatDateTime(order.createdAt),
    creatorName: order.creator.fullName || order.creator.username,
    creatorUsername: order.creator.username,
    itemCount,
    totalQty,
    totalValue,
    totalValueLabel: money(totalValue),
    previewItems: order.items.slice(0, 4).map((item) => ({
      name: item.component.name,
      quantity: item.quantity,
    })),
  };
};

export const mapDetailOrder = async (order: OrderWithRelations) => {
  const { itemCount, totalQty, totalValue } = totalsFromItems(order.items);
  const logs = await prisma.auditLog.findMany({
    where: { targetTable: "import_orders", targetId: order.id },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    id: order.id,
    code: order.code,
    note: order.note || "",
    status: order.status,
    supplierId: order.supplierId,
    supplierName: order.supplier?.name ?? "—",
    statusLabel: order.status === "confirmed" ? "Đã xác nhận" : "Nháp",
    createdAtLabel: formatDateTime(order.createdAt),
    creatorName: order.creator.fullName || order.creator.username,
    creatorUsername: order.creator.username,
    itemCount,
    totalQty,
    totalValue,
    totalValueLabel: money(totalValue),
    items: (order.items ?? []).map((item, index) => {
      const component = item.component;
      const unitPrice = toNumber(item.unitPrice);
      const lineTotal = item.quantity * unitPrice;
      const stockAfter = component?.inventory?.quantityOnHand ?? 0;
      const stockBefore =
        order.status === "confirmed" ? stockAfter - item.quantity : stockAfter;
      const categoryName = component?.category?.name || "LK";
      return {
        id: item.id,
        stt: String(index + 1).padStart(2, "0"),
        componentId: item.componentId,
        code: component
          ? componentCode(categoryName, component.id)
          : `COMP-${item.componentId}`,
        name: component?.name || "Linh kiện không còn trong danh mục",
        category: categoryName,
        brand: component?.brand?.name ?? "—",
        supplier: component?.supplier?.name ?? "—",
        brandName: component?.brand?.name ?? "—",
        supplierName: component?.supplier?.name ?? "—",
        unit: component?.unit || "cái",
        quantity: item.quantity,
        unitPrice,
        unitPriceLabel: money(unitPrice),
        lineTotal,
        lineTotalLabel: money(lineTotal),
        stockBefore,
        stockAfter,
      };
    }),
    logs: logs.map((log) => {
      const actorName =
        log.account?.fullName?.trim() || log.account?.username || "Hệ thống";
      return {
        actorName,
        actorInitials: actorName.slice(0, 2).toUpperCase(),
        action: log.action,
        detail: log.detail || "",
        createdAtLabel: formatDateTime(log.createdAt),
      };
    }),
  };
};

const parseRange = (from?: string, to?: string) => {
  const where: Prisma.ImportOrderWhereInput = {};
  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(`${from}T00:00:00`);
    }
    if (to) {
      where.createdAt.lte = new Date(`${to}T23:59:59`);
    }
  }
  return where;
};

export const getDefaultCreator = async () => {
  const account = await prisma.account.findFirst({
    orderBy: { id: "asc" },
  });
  if (!account) {
    throw new Error("NO_ACCOUNT");
  }
  return account;
};

export const getAccounts = async () => {
  return prisma.account.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, username: true, fullName: true },
  });
};

export const getComponentOptions = async () => {
  const rows = await prisma.component.findMany({
    where: { status: "active", deleted: false },
    select: {
      id: true,
      name: true,
      unit: true,
      unitPrice: true,
      brandId: true,
      supplierId: true,
      brand: { select: { name: true } },
      supplier: { select: { name: true } },
      category: { select: { name: true } },
      inventory: { select: { quantityOnHand: true } },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    unit: row.unit || "cái",
    unitPrice: toNumber(row.unitPrice),
    stock: row.inventory?.quantityOnHand ?? 0,
    category: row.category.name,
    code: componentCode(row.category.name, row.id),
    brandId: row.brandId,
    brandName: row.brand?.name ?? "—",
    supplierId: row.supplierId,
    supplierName: row.supplier?.name ?? "Chưa gán NCC",
  }));
};

export const generateCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00`);
  const count = await prisma.importOrder.count({
    where: { createdAt: { gte: start } },
  });
  let seq = count + 1;
  let code = `IMP-${year}-${String(seq).padStart(3, "0")}`;
  while (await prisma.importOrder.findUnique({ where: { code } })) {
    seq += 1;
    code = `IMP-${year}-${String(seq).padStart(3, "0")}`;
  }
  return code;
};

export const getStats = async () => {
  const [total, draft, confirmed, allItems] = await Promise.all([
    prisma.importOrder.count(),
    prisma.importOrder.count({ where: { status: "draft" } }),
    prisma.importOrder.count({ where: { status: "confirmed" } }),
    prisma.importOrderItem.findMany({
      include: { importOrder: { select: { status: true } } },
    }),
  ]);

  const totalValue = allItems.reduce(
    (sum, item) => sum + item.quantity * toNumber(item.unitPrice),
    0,
  );

  return {
    total,
    draft,
    confirmed,
    totalValue,
    totalValueLabel: money(totalValue),
  };
};

export const listOrders = async (filter: ImportOrderFilter) => {
  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(50, Math.max(10, filter.limit || 20));
  const where: Prisma.ImportOrderWhereInput = {
    ...parseRange(filter.from, filter.to),
  };

  if (filter.q) {
    where.code = { contains: filter.q.trim(), mode: "insensitive" };
  }
  if (filter.status === "draft" || filter.status === "confirmed") {
    where.status = filter.status;
  }
  if (filter.createdBy) {
    where.createdBy = filter.createdBy;
  }

  const [rows, total] = await Promise.all([
    prisma.importOrder.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.importOrder.count({ where }),
  ]);

  return {
    orders: rows.map(mapListOrder),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
    fromIndex: total === 0 ? 0 : (page - 1) * limit + 1,
    toIndex: Math.min(total, page * limit),
  };
};

export const listOrdersForExport = async (filter: ImportOrderFilter) => {
  const where: Prisma.ImportOrderWhereInput = {
    ...parseRange(filter.from, filter.to),
  };
  if (filter.q) {
    where.code = { contains: filter.q.trim(), mode: "insensitive" };
  }
  if (filter.status === "draft" || filter.status === "confirmed") {
    where.status = filter.status;
  }
  if (filter.createdBy) {
    where.createdBy = filter.createdBy;
  }

  const rows = await prisma.importOrder.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapListOrder);
};

export const getOrderById = async (id: number) => {
  return prisma.importOrder.findUnique({
    where: { id },
    include: orderInclude,
  });
};

const normalizeItems = (
  items: ImportOrderItemInput[],
): ImportOrderItemInput[] => {
  const map = new Map<number, ImportOrderItemInput>();
  for (const item of items) {
    if (!item.componentId) {
      continue;
    }
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const current = map.get(item.componentId);
    if (current) {
      current.quantity += quantity;
      continue;
    }
    map.set(item.componentId, {
      componentId: item.componentId,
      quantity,
      unitPrice,
    });
  }
  return [...map.values()];
};

export const createOrder = async (data: SaveImportOrderDto) => {
  const items = normalizeItems(data.items);
  if (!items.length) {
    throw new Error("NO_ITEMS");
  }

  const code =
    data.code &&
    !(await prisma.importOrder.findUnique({ where: { code: data.code } }))
      ? data.code
      : await generateCode();
  const order = await prisma.importOrder.create({
    data: {
      code,
      createdBy: data.createdBy,
      supplierId: data.supplierId,
      note: data.note?.trim() || null,
      status: "draft",
      items: {
        create: items.map((item) => ({
          componentId: item.componentId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: orderInclude,
  });

  await prisma.auditLog.create({
    data: {
      accountId: data.createdBy,
      action: "create_import_order",
      targetTable: "import_orders",
      targetId: order.id,
      detail: "Tạo phiếu và ghi nhận các dòng chi tiết",
    },
  });

  return order;
};

export const updateDraft = async (id: number, data: SaveImportOrderDto) => {
  const existing = await prisma.importOrder.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  if (existing.status !== "draft") {
    throw new Error("NOT_DRAFT");
  }

  const items = normalizeItems(data.items);
  if (!items.length) {
    throw new Error("NO_ITEMS");
  }

  const order = await prisma.$transaction(async (tx) => {
    await tx.importOrderItem.deleteMany({ where: { importOrderId: id } });
    return tx.importOrder.update({
      where: { id },
      data: {
        note: data.note?.trim() || null,
        supplierId: data.supplierId,
        items: {
          create: items.map((item) => ({
            componentId: item.componentId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: orderInclude,
    });
  });

  await prisma.auditLog.create({
    data: {
      accountId: data.createdBy,
      action: "update_import_order",
      targetTable: "import_orders",
      targetId: id,
      detail: "Cập nhật phiếu nhập nháp",
    },
  });

  return order;
};

export const confirmOrder = async (id: number, accountId: number) => {
  const existing = await getOrderById(id);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  if (existing.status !== "draft") {
    throw new Error("ALREADY_CONFIRMED");
  }
  if (
    !existing.items.length ||
    existing.items.some((item) => item.quantity <= 0)
  ) {
    throw new Error("INVALID_QTY");
  }

  await prisma.$transaction(async (tx) => {
    await tx.importOrder.update({
      where: { id },
      data: { status: "confirmed" },
    });

    for (const item of existing.items) {
      await tx.inventory.upsert({
        where: { componentId: item.componentId },
        update: { quantityOnHand: { increment: item.quantity } },
        create: {
          componentId: item.componentId,
          quantityOnHand: item.quantity,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        accountId,
        action: "confirm_import_order",
        targetTable: "import_orders",
        targetId: id,
        detail: "Xác nhận phiếu nhập và cập nhật tồn kho",
      },
    });
  });
};
/** Linh kiện cần nhập: tồn <= ngưỡng tối thiểu, còn kinh doanh */
export const getShortageComponents = async () => {
  const rows = await prisma.component.findMany({
    where: { status: "active", deleted: false },
    include: {
      inventory: true,
      category: true,
      brand: true,
      supplier: true,
    },
  });

  return rows
    .filter((c) => (c.inventory?.quantityOnHand ?? 0) <= c.minStockThreshold)
    .map((c) => {
      const onHand = c.inventory?.quantityOnHand ?? 0;
      const need = c.minStockThreshold - onHand;
      return {
        id: c.id,
        name: c.name,
        category: c.category.name,
        brand: c.brand?.name ?? "—",
        supplier: c.supplier?.name ?? "Chưa gán NCC",
        supplierId: c.supplierId,
        onHand,
        min: c.minStockThreshold,
        need: need > 0 ? need : 1,
        unit: c.unit ?? "cái",
        unitPrice: Number(c.unitPrice),
      };
    });
};
export const getSuppliers = () =>
  prisma.supplier.findMany({ orderBy: { name: "asc" } });

export const getBrands = () =>
  prisma.brand.findMany({ orderBy: { name: "asc" } });

export const upsertSupplierByName = async (rawName: string) => {
  const name = rawName.trim();
  if (!name) throw new Error("NO_SUPPLIER_NAME");
  return prisma.supplier.upsert({
    where: { name },
    update: {},
    create: { name },
  });
};

export const upsertBrandByName = async (rawName: string) => {
  const name = rawName.trim();
  if (!name) throw new Error("NO_BRAND_NAME");
  return prisma.brand.upsert({
    where: { name },
    update: {},
    create: { name },
  });
};

export const getPrefillItemsByIds = async (ids: number[]) => {
  if (!ids.length) return [];

  const rows = await prisma.component.findMany({
    where: { id: { in: ids }, status: "active", deleted: false },
    include: {
      inventory: true,
      category: true,
      brand: true,
      supplier: true,
    },
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return rows.map((c) => {
    const onHand = c.inventory?.quantityOnHand ?? 0;
    const need = c.minStockThreshold - onHand;
    return {
      componentId: c.id,
      code: componentCode(c.category.name, c.id),
      name: c.name,
      category: c.category.name,
      brandName: c.brand?.name ?? "—",
      supplierName: c.supplier?.name ?? "Chưa gán NCC",
      stockAfter: onHand,
      quantity: need > 0 ? need : 1,
      unitPrice: Number(c.unitPrice),
    };
  });
};
