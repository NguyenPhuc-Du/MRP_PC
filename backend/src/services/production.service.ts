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