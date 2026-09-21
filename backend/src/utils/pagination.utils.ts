export const paginationHelper = (
  query: any,
  objectPagination: any,
  countComponents: number,
) => {
  const limit = objectPagination.limit || 10;
  const countPage = Math.max(1, Math.ceil(countComponents / limit) || 1);
  let currentPage = Math.max(1, Number(query.page) || 1);
  if (currentPage > countPage) {
    currentPage = countPage;
  }

  objectPagination.limit = limit;
  objectPagination.currentPage = currentPage;
  objectPagination.countPage = countPage;
  objectPagination.skipPage = (currentPage - 1) * limit;

  return objectPagination;
};
