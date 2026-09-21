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
