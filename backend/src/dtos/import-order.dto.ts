export type ImportOrderItemInput = {
  componentId: number;
  quantity: number;
  unitPrice: number;
};

export type ImportOrderFilter = {
  q?: string;
  status?: "draft" | "confirmed" | "";
  createdBy?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type SaveImportOrderDto = {
  code?: string;
  note?: string;
  items: ImportOrderItemInput[];
  createdBy: number;
};
