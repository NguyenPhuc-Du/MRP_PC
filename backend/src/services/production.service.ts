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