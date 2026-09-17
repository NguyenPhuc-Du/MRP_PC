(function () {
  var items = document.querySelectorAll(".nav-item");
  items.forEach(function (item) {
    item.classList.remove("active");
    if (item.getAttribute("href") === "/admin/bom") {
      item.classList.add("active");
    }
  });
})();
