/** Đơn vị tính cố định cho linh kiện kho PC */
export const COMPONENT_UNITS = [
  "cái",
  "thanh",
  "bộ",
  "ổ",
  "dây",
  "mét",
  "cuộn",
  "hộp",
  "cặp",
  "tấm",
] as const;

export type ComponentUnit = (typeof COMPONENT_UNITS)[number];

export const DEFAULT_COMPONENT_UNIT: ComponentUnit = "cái";
