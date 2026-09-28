import { prisma } from "../config/db";

export async function getMyOders(accountId: number) {
    return await prisma.productionOrder.findMany({
        where: {
            assignedTo: accountId,
        },

        select: {
            id: true,
            quantityRequested: true,
            status: true,
            createdAt: true,
            completedAt: true,
            pcConfig: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },

        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getMyOrderById(accountId: number, orderId: number) {
    return prisma.productionOrder.findFirst({
        where: {
            id: orderId,
            assignedTo: accountId,
        },
        select: {
            id: true,
            quantityRequested: true,
            status: true,
            createdAt: true,
            completedAt: true,
            pcConfig: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });
}

export async function getOrderStockCheck(accountId: number, orderId: number) {
    const order = await prisma.productionOrder.findFirst({
      where: {
        id: orderId,
        assignedTo: accountId,
      },
      select: {
        id: true,
        quantityRequested: true,
        pcConfig: {
          select: {
            id: true,
            name: true,
            bomItems: {
              select: {
                quantity: true,
                component: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    inventory: {
                      select: {
                        quantityOnHand: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  
    if (!order) {
      return null;
    }
  
    const items = order.pcConfig.bomItems.map((bom) => {
      const requiredQty = bom.quantity * order.quantityRequested;
      const onHandQty = bom.component.inventory?.quantityOnHand ?? 0;
      const missingQty = Math.max(0, requiredQty - onHandQty);
  
      return {
        componentId: bom.component.id,
        componentName: bom.component.name,
        unit: bom.component.unit,
        bomQtyPerUnit: bom.quantity,
        requiredQty,
        onHandQty,
        missingQty,
        isEnough: onHandQty >= requiredQty,
      };
    });
  
    return {
      orderId: order.id,
      configName: order.pcConfig.name,
      quantityRequested: order.quantityRequested,
      allEnough: items.every((item) => item.isEnough),
      items,
    };
  }

function poNotePrefix(orderId: number): string {
  return `PO#${orderId}`;
}

async function findLatestExport(orderId: number, type: "material" | "finished_product") {
  return prisma.exportOrder.findFirst({
    where: {
      type,
      note: { startsWith: poNotePrefix(orderId) },
    },
    select: {
      id: true,
      code: true,
      status: true,
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

function makeExportCode(kind: "M" | "P"): string {
  const now = new Date();
  const stamp = [
    now.getFullYear().toString().slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `PX${kind}-${stamp}-${rand}`;
}

async function getAssignedOrder(accountId: number, orderId: number) {
  return prisma.productionOrder.findFirst({
    where: { id: orderId, assignedTo: accountId },
    include: {
      pcConfig: {
        include: {
          bomItems: {
            include: {
              component: {
                include: { inventory: true },
              },
            },
          },
        },
      },
    },
  });
}

function mapExportSummary(
  exportOrder: Awaited<ReturnType<typeof findLatestExport>>,
) {
  if (!exportOrder) {
    return null;
  }

  return {
    id: exportOrder.id,
    code: exportOrder.code,
    status: exportOrder.status,
  };
}

export async function getAssembleStatus(accountId: number, orderId: number) {
  const order = await getAssignedOrder(accountId, orderId);
  if (!order) {
    return null;
  }

  const stock = await getOrderStockCheck(accountId, orderId);
  const materialExport = await findLatestExport(orderId, "material");
  const productExport = await findLatestExport(orderId, "finished_product");
  const isDone = order.status === "done";

  return {
    order: {
      id: order.id,
      configName: order.pcConfig.name,
      description: order.pcConfig.description,
      quantityRequested: order.quantityRequested,
      status: order.status,
    },
    allEnough: stock?.allEnough ?? false,
    missingCount: stock?.items.filter((item) => !item.isEnough).length ?? 0,
    materialExport: mapExportSummary(materialExport),
    productExport: mapExportSummary(productExport),
    canRequestMaterial:
      !isDone &&
      (!materialExport || materialExport.status === "rejected"),
    canConfirmAssemble: !isDone && (stock?.allEnough ?? false),
    canRequestProduct:
      isDone &&
      (!productExport || productExport.status === "rejected"),
  };
}

export async function requestMaterialExport(accountId: number, orderId: number) {
  const order = await getAssignedOrder(accountId, orderId);
  if (!order) {
    return null;
  }

  if (order.status === "done") {
    throw new Error("ORDER_DONE");
  }

  const existing = await findLatestExport(orderId, "material");
  if (existing && existing.status !== "rejected") {
    throw new Error("MATERIAL_EXPORT_EXISTS");
  }

  if (order.pcConfig.bomItems.length === 0) {
    throw new Error("NO_BOM");
  }

  const created = await prisma.$transaction(async (tx) => {
    if (order.status === "pending") {
      await tx.productionOrder.update({
        where: { id: order.id },
        data: { status: "in_progress" },
      });
    }

    return tx.exportOrder.create({
      data: {
        code: makeExportCode("M"),
        type: "material",
        requestedBy: accountId,
        status: "pending",
        note: `${poNotePrefix(order.id)} Xuất NVL cho lệnh lắp ${order.pcConfig.name}`,
        items: {
          create: order.pcConfig.bomItems.map((bom) => ({
            componentId: bom.componentId,
            quantity: bom.quantity * order.quantityRequested,
          })),
        },
      },
      select: {
        id: true,
        code: true,
        status: true,
      },
    });
  });

  return created;
}

export async function confirmAssemble(accountId: number, orderId: number) {
  const order = await getAssignedOrder(accountId, orderId);
  if (!order) {
    return null;
  }

  if (order.status === "done") {
    throw new Error("ORDER_DONE");
  }

  const requirements = order.pcConfig.bomItems.map((bom) => ({
    componentId: bom.componentId,
    requiredQty: bom.quantity * order.quantityRequested,
    onHand: bom.component.inventory?.quantityOnHand ?? 0,
  }));

  if (requirements.some((item) => item.onHand < item.requiredQty)) {
    throw new Error("STOCK_NOT_ENOUGH");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of requirements) {
      await tx.inventory.update({
        where: { componentId: item.componentId },
        data: { quantityOnHand: { decrement: item.requiredQty } },
      });
    }

    await tx.productionOrder.update({
      where: { id: order.id },
      data: {
        status: "done",
        completedAt: new Date(),
      },
    });
  });

  return { orderId: order.id, status: "done" as const };
}

export async function requestProductExport(accountId: number, orderId: number) {
  const order = await getAssignedOrder(accountId, orderId);
  if (!order) {
    return null;
  }

  if (order.status !== "done") {
    throw new Error("ORDER_NOT_DONE");
  }

  const existing = await findLatestExport(orderId, "finished_product");
  if (existing && existing.status !== "rejected") {
    throw new Error("PRODUCT_EXPORT_EXISTS");
  }

  return prisma.exportOrder.create({
    data: {
      code: makeExportCode("P"),
      type: "finished_product",
      requestedBy: accountId,
      status: "pending",
      note: `${poNotePrefix(order.id)} Xuất thành phẩm ${order.pcConfig.name}`,
      items: {
        create: [
          {
            pcConfigId: order.pcConfigId,
            quantity: order.quantityRequested,
          },
        ],
      },
    },
    select: {
      id: true,
      code: true,
      status: true,
    },
  });
}

const buildableQty = (
  items: Array<{ quantity: number; component: { inventory: { quantityOnHand: number } | null } }>,
): number => {
  if (!items.length) {
    return 0;
  }

  return items.reduce((min, item) => {
    const onHand = item.component.inventory?.quantityOnHand ?? 0;
    const perUnit = item.quantity > 0 ? item.quantity : 1;
    const canBuild = Math.floor(onHand / perUnit);
    return Math.min(min, canBuild);
  }, Number.POSITIVE_INFINITY);
};

const staffInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export async function getCreateFormData() {
  const [configs, staffAccounts] = await Promise.all([
    prisma.pcConfig.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        bomItems: {
          select: {
            quantity: true,
            component: {
              select: {
                inventory: {
                  select: { quantityOnHand: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({
      where: {
        role: "staff",
        status: "active",
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return {
    pcConfigs: configs.map((config) => ({
      id: config.id,
      name: config.name,
      image: config.imageUrl ?? "",
      sku: `CFG-${String(config.id).padStart(3, "0")}`,
      availableStock: buildableQty(config.bomItems),
    })),
    accounts: staffAccounts.map((account) => {
      const name = account.fullName || account.username;
      return {
        id: account.id,
        name,
        role: "Nhân viên lắp ráp",
        initials: staffInitials(name),
      };
    }),
  };
}

export type CreateProductionOrderInput = {
  createdBy: number;
  pcConfigId: number;
  quantityRequested: number;
  assignedTo?: number;
};

export async function createProductionOrder(input: CreateProductionOrderInput) {
  const quantityRequested = Math.floor(input.quantityRequested);
  if (!Number.isInteger(quantityRequested) || quantityRequested < 1) {
    throw new Error("INVALID_QUANTITY");
  }

  const config = await prisma.pcConfig.findUnique({
    where: { id: input.pcConfigId },
    select: { id: true, name: true, status: true },
  });

  if (!config) {
    throw new Error("CONFIG_NOT_FOUND");
  }

  if (config.status !== "active") {
    throw new Error("CONFIG_INACTIVE");
  }

  let assignedTo: number | null = null;
  if (input.assignedTo) {
    const staff = await prisma.account.findFirst({
      where: {
        id: input.assignedTo,
        role: "staff",
        status: "active",
      },
      select: { id: true },
    });

    if (!staff) {
      throw new Error("STAFF_INVALID");
    }

    assignedTo = staff.id;
  }

  return prisma.productionOrder.create({
    data: {
      pcConfigId: config.id,
      quantityRequested,
      assignedTo,
      createdBy: input.createdBy,
      status: "pending",
    },
    select: {
      id: true,
      quantityRequested: true,
      status: true,
      assignedTo: true,
      pcConfig: {
        select: { name: true },
      },
      assignee: {
        select: {
          fullName: true,
          username: true,
        },
      },
    },
  });
}

const INDEX_STAGES = [
  { key: "wait", status: "pending" as const, variant: "wait", label: "Chờ sản xuất", progress: 0 },
  { key: "assembly", status: "in_progress" as const, variant: "assembly", label: "Đang lắp ráp", progress: 50 },
  { key: "done", status: "done" as const, variant: "done", label: "Hoàn thành", progress: 100 },
];

export async function countAllOrders() {
  return prisma.productionOrder.count();
}

export async function getStageCounts() {
  const grouped = await prisma.productionOrder.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countByStatus = Object.fromEntries(
    grouped.map((row) => [row.status, row._count._all]),
  );

  return INDEX_STAGES.map((stage) => ({
    key: stage.key,
    variant: stage.variant,
    label: stage.label,
    count: countByStatus[stage.status] ?? 0,
  }));
}

export async function getIndexData(skip: number, take: number) {
  const rows = await prisma.productionOrder.findMany({
    skip,
    take,
    select: {
      id: true,
      quantityRequested: true,
      status: true,
      createdAt: true,
      pcConfig: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      assignee: {
        select: {
          fullName: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orders = rows.map((row) => {
    const stage = INDEX_STAGES.find((item) => item.status === row.status) ?? INDEX_STAGES[0];
    const ownerName = row.assignee?.fullName || row.assignee?.username || "";

    return {
      id: row.id,
      code: String(row.id).padStart(3, "0"),
      name: row.pcConfig.name,
      image: row.pcConfig.imageUrl ?? "",
      bom: row.pcConfig.name,
      qty: row.quantityRequested,
      stageKey: stage.key,
      stageVariant: stage.variant,
      stageLabel: stage.label,
      owner: ownerName,
    };
  });

  return { orders };
}

const EXPORT_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export async function getOrderDetail(orderId: number) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return null;
  }

  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      quantityRequested: true,
      status: true,
      createdAt: true,
      completedAt: true,
      pcConfig: {
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          bomItems: {
            select: {
              quantity: true,
              component: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  inventory: {
                    select: { quantityOnHand: true },
                  },
                },
              },
            },
          },
        },
      },
      assignee: {
        select: {
          fullName: true,
          username: true,
        },
      },
      creator: {
        select: {
          fullName: true,
          username: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  const [materialExport, productExport] = await Promise.all([
    findLatestExport(order.id, "material"),
    findLatestExport(order.id, "finished_product"),
  ]);

  const stage = INDEX_STAGES.find((item) => item.status === order.status) ?? INDEX_STAGES[0];
  const items = order.pcConfig.bomItems.map((bom) => {
    const requiredQty = bom.quantity * order.quantityRequested;
    const onHandQty = bom.component.inventory?.quantityOnHand ?? 0;

    return {
      componentId: bom.component.id,
      name: bom.component.name,
      unit: bom.component.unit,
      bomQty: bom.quantity,
      requiredQty,
      onHandQty,
      missingQty: Math.max(0, requiredQty - onHandQty),
      isEnough: onHandQty >= requiredQty,
    };
  });

  const assigneeName = order.assignee?.fullName || order.assignee?.username || "";
  const mapExport = (row: Awaited<ReturnType<typeof findLatestExport>>) => {
    if (!row) return null;
    return {
      ...mapExportSummary(row),
      statusLabel: EXPORT_STATUS_LABEL[row.status] ?? row.status,
    };
  };

  return {
    id: order.id,
    code: String(order.id).padStart(3, "0"),
    quantityRequested: order.quantityRequested,
    status: order.status,
    stageVariant: stage.variant,
    stageLabel: stage.label,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
    pcConfig: {
      id: order.pcConfig.id,
      name: order.pcConfig.name,
      description: order.pcConfig.description ?? "",
      image: order.pcConfig.imageUrl ?? "",
      sku: `CFG-${String(order.pcConfig.id).padStart(3, "0")}`,
    },
    assignee: assigneeName
      ? { name: assigneeName, initials: staffInitials(assigneeName) }
      : null,
    creatorName: order.creator.fullName || order.creator.username,
    items,
    allEnough: items.length > 0 && items.every((item) => item.isEnough),
    materialExport: mapExport(materialExport),
    productExport: mapExport(productExport),
  };
}