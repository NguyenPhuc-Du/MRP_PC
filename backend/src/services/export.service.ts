import { prisma } from "../config/database";
import { Prisma } from "../generated/prisma";
import { ExportOrderFilter } from "../dtos/export-order.dto";
import { formatDate } from "../utils/date.util";

const STATUS_LABEL = {
  pending: "Chờ duyệt",
  approved: "Đã xuất",
  rejected: "Từ chối",
} as const;

const TYPE_LABEL = {
  material: "Linh kiện",
  finished_product: "Thành phẩm",
} as const;

const orderInclude = {
  requester: { select: { fullName: true, username: true } },
  approver: { select: { fullName: true, username: true } },
  items: {
    include: {
      component: {
        select: {
          id: true,
          name: true,
          unit: true,
          supplierId: true,
          supplier: { select: { name: true } },
          inventory: { select: { quantityOnHand: true } },
        },
      },
      pcConfig: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ExportOrderInclude;

type OrderRow = Prisma.ExportOrderGetPayload<{ include: typeof orderInclude }>;

const personName = (
  person: { fullName: string | null; username: string } | null,
) => person?.fullName?.trim() || person?.username || "—";

const productionLabel = (note: string | null) => {
  if (!note) return "—";
  const match = note.match(/^PO#(\d+)/);
  if (!match) return note;
  return `Lệnh #${match[1]}`;
};

const mapLines = (order: OrderRow) => {
  const issued = order.status === "approved" && order.type === "material";
  return order.items.map((item) => {
    if (item.component) {
      const onHand = item.component.inventory?.quantityOnHand ?? 0;
      const enough = issued || onHand >= item.quantity;
      return {
        kind: "component" as const,
        componentId: item.component.id,
        supplierId: item.component.supplierId,
        supplierName: item.component.supplier?.name ?? "Chưa gán NCC",
        name: item.component.name,
        unit: item.component.unit || "cái",
        quantity: item.quantity,
        onHand,
        after: issued ? onHand : onHand - item.quantity,
        enough,
      };
    }
    return {
      kind: "product" as const,
      componentId: null,
      supplierId: null,
      supplierName: "",
      name: item.pcConfig?.name || "Thành phẩm",
      unit: "máy",
      quantity: item.quantity,
      onHand: null as number | null,
      after: null as number | null,
      enough: true,
    };
  });
};

const mapOrder = (order: OrderRow) => {
  const lines = mapLines(order);
  const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
  const stockOk = lines.every((line) => line.enough);
  return {
    id: order.id,
    code: order.code,
    type: order.type,
    typeLabel: TYPE_LABEL[order.type],
    status: order.status,
    statusLabel: STATUS_LABEL[order.status],
    note: order.note || "",
    createdAtLabel: formatDate(order.createdAt),
    approvedAtLabel: formatDate(order.approvedAt),
    requesterName: personName(order.requester),
    approverName: personName(order.approver),
    productionLabel: productionLabel(order.note),
    itemCount: lines.length,
    totalQty,
    stockOk,
    canApprove: order.status === "pending" && stockOk,
    lines,
  };
};

const whereFromFilter = (
  filter: ExportOrderFilter,
): Prisma.ExportOrderWhereInput => {
  const where: Prisma.ExportOrderWhereInput = {};
  if (filter.from || filter.to) {
    where.createdAt = {
      gte: filter.from ? new Date(`${filter.from}T00:00:00`) : undefined,
      lte: filter.to ? new Date(`${filter.to}T23:59:59`) : undefined,
    };
  }
  if (filter.q) {
    where.code = { contains: filter.q.trim(), mode: "insensitive" };
  }
  if (filter.type === "material" || filter.type === "finished_product") {
    where.type = filter.type;
  }
  if (
    filter.status === "pending" ||
    filter.status === "approved" ||
    filter.status === "rejected"
  ) {
    where.status = filter.status;
  }
  return where;
};

export const getStats = async () => {
  const [pending, approved, rejected, pendingMaterial] = await Promise.all([
    prisma.exportOrder.count({ where: { status: "pending" } }),
    prisma.exportOrder.count({ where: { status: "approved" } }),
    prisma.exportOrder.count({ where: { status: "rejected" } }),
    prisma.exportOrder.findMany({
      where: { status: "pending", type: "material" },
      select: {
        items: {
          select: {
            quantity: true,
            component: {
              select: { inventory: { select: { quantityOnHand: true } } },
            },
          },
        },
      },
    }),
  ]);

  const shortPending = pendingMaterial.filter((order) =>
    order.items.some(
      (item) =>
        item.quantity > (item.component?.inventory?.quantityOnHand ?? 0),
    ),
  ).length;

  return { pending, approved, rejected, shortPending };
};

export const listOrders = async (filter: ExportOrderFilter) => {
  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(50, Math.max(10, filter.limit || 20));
  const where = whereFromFilter(filter);
  const [rows, total] = await Promise.all([
    prisma.exportOrder.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.exportOrder.count({ where }),
  ]);

  return {
    orders: rows.map(mapOrder),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
    fromIndex: total === 0 ? 0 : (page - 1) * limit + 1,
    toIndex: Math.min(total, page * limit),
  };
};

export const getDetail = async (id: number) => {
  const order = await prisma.exportOrder.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) return null;

  const mapped = mapOrder(order);
  const groups = new Map<
    string,
    { supplierId: number | null; supplierName: string; ids: number[] }
  >();

  for (const line of mapped.lines) {
    if (line.kind !== "component" || line.enough || !line.componentId) continue;
    const key = line.supplierId == null ? "none" : String(line.supplierId);
    const current = groups.get(key);
    if (current) {
      current.ids.push(line.componentId);
      continue;
    }
    groups.set(key, {
      supplierId: line.supplierId,
      supplierName: line.supplierName,
      ids: [line.componentId],
    });
  }

  return { ...mapped, shortGroups: [...groups.values()] };
};

export const approve = async (id: number, accountId: number) => {
  await prisma.$transaction(async (tx) => {
    const order = await tx.exportOrder.findUnique({
      where: { id },
      include: {
        items: { include: { component: { include: { inventory: true } } } },
      },
    });
    if (!order) throw new Error("NOT_FOUND");
    if (order.status !== "pending") throw new Error("NOT_PENDING");

    if (order.type === "material") {
      for (const item of order.items) {
        if (!item.componentId) throw new Error("INVALID_LINE");
        const onHand = item.component?.inventory?.quantityOnHand ?? 0;
        if (onHand < item.quantity) throw new Error("STOCK_NOT_ENOUGH");
      }
      for (const item of order.items) {
        await tx.inventory.update({
          where: { componentId: item.componentId! },
          data: { quantityOnHand: { decrement: item.quantity } },
        });
      }
    }

    const updated = await tx.exportOrder.updateMany({
      where: { id, status: "pending" },
      data: {
        status: "approved",
        approvedBy: accountId,
        approvedAt: new Date(),
      },
    });
    if (updated.count !== 1) throw new Error("NOT_PENDING");

    await tx.auditLog.create({
      data: {
        accountId,
        action: "approve_export_order",
        targetTable: "export_orders",
        targetId: id,
        detail:
          order.type === "material"
            ? "Duyệt phiếu xuất linh kiện và trừ tồn"
            : "Duyệt phiếu xuất thành phẩm",
      },
    });
  });
};

export const reject = async (id: number, accountId: number) => {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.exportOrder.updateMany({
      where: { id, status: "pending" },
      data: {
        status: "rejected",
        approvedBy: accountId,
        approvedAt: new Date(),
      },
    });
    if (updated.count !== 1) throw new Error("NOT_PENDING");

    await tx.auditLog.create({
      data: {
        accountId,
        action: "reject_export_order",
        targetTable: "export_orders",
        targetId: id,
        detail: "Từ chối phiếu xuất, không đổi tồn",
      },
    });
  });
};
