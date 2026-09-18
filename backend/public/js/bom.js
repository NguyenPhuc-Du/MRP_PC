(function () {
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.classList.remove("active");
    if (item.getAttribute("href") === "/admin/bom") {
      item.classList.add("active");
    }
  });

  var list = document.getElementById("bom-extra-list");
  var addBtn = document.getElementById("bom-add-item");
  var template = document.getElementById("bom-item-template");
  var form = document.getElementById("bom-form");
  var costText = document.getElementById("bom-cost-text");
  var suggestText = document.getElementById("bom-suggest-text");
  var saleText = document.getElementById("bom-sale-text");
  var saleInput = document.getElementById("bom-sale-price");
  var marginText = document.getElementById("bom-margin-text");
  var marginRate = 0.15;

  function formatVnd(value) {
    return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + " đ";
  }

  function selectedPrice(select) {
    if (!select || !select.selectedOptions || !select.selectedOptions[0]) return 0;
    return Number(select.selectedOptions[0].getAttribute("data-price") || 0);
  }

  function reindex() {
    if (!list) return;
    Array.prototype.forEach.call(list.children, function (row, index) {
      var select = row.querySelector('select[name*="[componentId]"]');
      var qty = row.querySelector('input[name*="[quantity]"]');
      if (select) select.setAttribute("name", "extras[" + index + "][componentId]");
      if (qty) qty.setAttribute("name", "extras[" + index + "][quantity]");
    });
  }

  function updateTotals() {
    if (!form || !costText) return;

    var requiredSelects = form.querySelectorAll("[data-bom-required='1']");
    var complete = true;
    Array.prototype.forEach.call(requiredSelects, function (select) {
      if (!select.value) complete = false;
    });

    if (!complete) {
      costText.textContent = "Chưa đủ linh kiện";
      if (suggestText) suggestText.textContent = "—";
      if (saleText) saleText.textContent = "Chưa chốt";
      if (marginText) marginText.textContent = "—";
      return;
    }

    var total = 0;
    form.querySelectorAll(".bom-cost-select").forEach(function (select) {
      if (!select.value) return;
      var row = select.closest(".bom-slot, .bom-item-edit") || form;
      var qtyInput = row.querySelector(".bom-cost-qty");
      var qty = Number(qtyInput && qtyInput.value ? qtyInput.value : 1);
      if (!Number.isFinite(qty) || qty < 1) qty = 1;
      total += selectedPrice(select) * qty;
    });

    var suggested = total / (1 - marginRate);
    var sale = Number(saleInput && saleInput.value);
    var hasSale = Number.isFinite(sale) && sale > 0;
    var marginBase = hasSale ? sale : suggested;
    var margin = marginBase > 0 ? ((marginBase - total) / marginBase) * 100 : 0;
    costText.textContent = formatVnd(total);
    if (suggestText) suggestText.textContent = formatVnd(suggested);
    if (saleText) saleText.textContent = hasSale ? formatVnd(sale) : "Chưa chốt";
    if (marginText) marginText.textContent = margin.toFixed(1).replace(".", ",") + "%";
  }

  if (addBtn && template && list) {
    addBtn.addEventListener("click", function () {
      var html = template.innerHTML.replace(/__index__/g, String(list.children.length));
      var wrap = document.createElement("div");
      wrap.innerHTML = html.trim();
      if (wrap.firstElementChild) {
        list.appendChild(wrap.firstElementChild);
      }
      reindex();
      updateTotals();
    });
  }

  if (list) {
    list.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var button = target.closest(".bom-item-del");
      if (!button) return;
      var row = button.closest(".bom-item-edit");
      if (row) {
        row.remove();
        reindex();
        updateTotals();
      }
    });
  }

  if (form) {
    form.addEventListener("change", updateTotals);
    form.addEventListener("input", updateTotals);
    updateTotals();
  }
})();
