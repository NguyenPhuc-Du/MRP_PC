(function () {
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.classList.remove("active");
    var href = item.getAttribute("href") || "";
    if (href === "/admin/bom" || href === "/warehouse/bom") {
      item.classList.add("active");
    }
  });
  const paginationButton= document.querySelectorAll('[pagination-button]');
paginationButton.forEach(button => {
    button.addEventListener('click', () => {
        const url = new URL(window.location.href);
        const page = button.getAttribute('data-page');
        if(page) {
            url.searchParams.set('page', page);

        } else {
            url.searchParams.delete('page');
        }
        window.location.href = url.toString();
    });
});

  var list = document.getElementById("bom-extra-list");
  var addBtn = document.getElementById("bom-add-item");
  var template = document.getElementById("bom-item-template");
  var form = document.getElementById("bom-form");
  var missingWarn = document.getElementById("bom-missing-warn");

  function reindex() {
    if (!list) return;
    Array.prototype.forEach.call(list.children, function (row, index) {
      var select = row.querySelector('select[name*="[componentId]"]');
      var qty = row.querySelector('input[name*="[quantity]"]');
      if (select) select.setAttribute("name", "extras[" + index + "][componentId]");
      if (qty) qty.setAttribute("name", "extras[" + index + "][quantity]");
    });
  }

  function missingSlotLabels() {
    if (!form) return [];
    var missing = [];
    form.querySelectorAll("[data-bom-required='1']").forEach(function (select) {
      var empty = !select.value;
      select.classList.toggle("is-missing", empty);
      if (!empty) return;
      var slot = select.closest(".bom-slot");
      var label = slot ? slot.querySelector(".bom-slot-label") : null;
      missing.push(label ? label.textContent.trim() : "linh kiện");
    });
    return missing;
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
      }
    });
  }

  if (form) {
    form.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || !target.matches || !target.matches("[data-bom-required='1']")) return;
      if (target.value) target.classList.remove("is-missing");
      if (!missingWarn || missingWarn.hidden) return;
      var missing = missingSlotLabels();
      if (!missing.length) {
        missingWarn.hidden = true;
        return;
      }
      missingWarn.textContent = "Chưa chọn đủ linh kiện (" + missing.join(", ") + "). Hãy chọn đủ rồi tạo lại.";
    });

    form.addEventListener("submit", function (event) {
      var missing = missingSlotLabels();
      if (!missing.length) {
        if (missingWarn) missingWarn.hidden = true;
        return;
      }
      event.preventDefault();
      if (!missingWarn) return;
      missingWarn.hidden = false;
      missingWarn.textContent = "Chưa chọn đủ linh kiện (" + missing.join(", ") + "). Hãy chọn đủ rồi tạo lại.";
      missingWarn.scrollIntoView({ block: "nearest" });
    });
  }
})();
