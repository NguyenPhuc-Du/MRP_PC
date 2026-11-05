import "express-session";

declare module "express-session" {
  interface SessionData {
    oldInput?: Record<string, string>;
    bomDraft?: {
      configId?: number;
      name: string;
      description: string;
      salePrice: string;
      status: "active" | "inactive";
      slots: Record<string, { componentId: string; quantity: number }>;
      extras: Array<{ componentId: number; quantity: number }>;
    };

    // dùng lưu session trc cho manager quản lý
    account?: {
      id: number;
      username: string;
      fullName: string | null;
      role: "admin" | "warehouse_manager" | "staff";
    };
  }
}
