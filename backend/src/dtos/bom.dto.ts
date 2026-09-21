export type BomItemInput = {
  componentId: number;
  quantity: number;
};

export type CreateBomDto = {
  name: string;
  description?: string;
  salePrice?: number;
  imageUrl?: string;
  status?: "active" | "inactive";
  items: BomItemInput[];
};

export type UpdateBomDto = Partial<Omit<CreateBomDto, "items">> & {
  items?: BomItemInput[];
};

export type BomSlotKey =
  | "cpu"
  | "main"
  | "ram"
  | "storage"
  | "psu"
  | "cooler"
  | "case";

