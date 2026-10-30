import { Prisma } from "../generated/prisma";

type Tx = Prisma.TransactionClient;

export async function decrementComponentStock(
  tx: Tx,
  componentId: number,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    return;
  }

  const updated = await tx.inventory.updateMany({
    where: {
      componentId,
      quantityOnHand: { gte: quantity },
    },
    data: { quantityOnHand: { decrement: quantity } },
  });

  if (updated.count !== 1) {
    throw new Error("STOCK_NOT_ENOUGH");
  }
}

export async function incrementProductStock(
  tx: Tx,
  pcConfigId: number,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    return;
  }

  await tx.productInventory.upsert({
    where: { pcConfigId },
    update: { quantityOnHand: { increment: quantity } },
    create: { pcConfigId, quantityOnHand: quantity },
  });
}

export async function decrementProductStock(
  tx: Tx,
  pcConfigId: number,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    return;
  }

  const updated = await tx.productInventory.updateMany({
    where: {
      pcConfigId,
      quantityOnHand: { gte: quantity },
    },
    data: { quantityOnHand: { decrement: quantity } },
  });

  if (updated.count !== 1) {
    throw new Error("STOCK_NOT_ENOUGH");
  }
}
