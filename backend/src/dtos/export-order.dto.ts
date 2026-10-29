export type ExportOrderFilter = {
  q?: string;
  type?: "material" | "finished_product" | "";
  status?: "pending" | "approved" | "rejected" | "";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
