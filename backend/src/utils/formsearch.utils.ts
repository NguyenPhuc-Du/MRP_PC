export const formsearchHelper = (query: any) => {
  const raw = query?.keyword;
  const keyword = typeof raw === "string" ? raw.trim() : "";
  return { keyword };
};
