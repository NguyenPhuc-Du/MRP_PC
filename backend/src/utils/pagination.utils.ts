export const paginationHelper=(query: any, objectPagination: any, countComponents: number)=>{
    if(query.page){
        objectPagination.currentPage = Math.max(1, Number(query.page) || 1);
      }
      objectPagination.skipPage=(objectPagination.currentPage-1)*objectPagination.limit;
      if(query.page){
        objectPagination.currentPage = Math.max(1, Number(query.page) || 1);
      }
      objectPagination.skipPage=(objectPagination.currentPage-1)*objectPagination.limit;
      objectPagination.countPage=Math.ceil(countComponents/10);

      return objectPagination
}