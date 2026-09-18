(function () {
  var prefix = (document.querySelector(".io-page") || {}).dataset
    ? document.querySelector(".io-page").dataset.prefix
    : "/admin";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function openEl(el) {
    if (el) el.classList.add("is-open");
  }
  function closeEl(el) {
    if (el) el.classList.remove("is-open");
  }

  var overlay = qs(".io-overlay:not(.is-picker):not(.is-modal)") || qs(".io-overlay");
  var drawer = qs(".io-drawer");
  var picker = qs(".io-picker");
  var pickerOverlay = qs(".io-overlay.is-picker");
  var modal = qs(".io-modal");
  var modalOverlay = qs(".io-overlay.is-modal");

  function fillDrawer(order) {
    if (!drawer || !order) return;
    qs(".io-drawer-title", drawer).textContent = order.code;
    qs(".io-kv-creator", drawer).textContent = order.creatorName;
    qs(".io-kv-date", drawer).textContent = order.createdAtLabel;
    qs(".io-kv-items", drawer).textContent = order.itemCount + " linh kiện";
    qs(".io-kv-qty", drawer).textContent = order.totalQty;
    var statusWrap = qs(".io-drawer-status", drawer);
    statusWrap.innerHTML =
      order.status === "confirmed"
        ? '<span class="io-badge is-ok"><i class="bi bi-check-circle"></i> Đã xác nhận</span>'
        : '<span class="io-badge is-draft"><i class="bi bi-file-earmark"></i> Nháp</span>';
    var list = qs(".io-drawer-lines-list", drawer);
    list.innerHTML = (order.previewItems || [])
      .map(function (item) {
        return (
          '<div class="io-drawer-line"><span>' +
          item.name +
          '</span><strong>× ' +
          item.quantity +
          "</strong></div>"
        );
      })
      .join("");
    qs(".io-drawer-cta", drawer).href = prefix + "/importOrders/" + order.id;
  }

  function openDrawer(order) {
    fillDrawer(order);
    openEl(overlay);
    openEl(drawer);
  }

  function closeDrawer() {
    closeEl(overlay);
    closeEl(drawer);
  }

  qsa(".io-row").forEach(function (row) {
    row.addEventListener("click", function (e) {
      if (e.target.closest(".io-more, .io-menu, .io-more-btn")) return;
      try {
        openDrawer(JSON.parse(row.dataset.order));
      } catch (err) {}
    });
  });

  qsa(".js-open-drawer").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var row = btn.closest(".io-row");
      if (!row) return;
      closeAllMenus();
      openDrawer(JSON.parse(row.dataset.order));
    });
  });

  qsa(".js-close-drawer").forEach(function (btn) {
    btn.addEventListener("click", closeDrawer);
  });
  if (overlay) overlay.addEventListener("click", closeDrawer);

  function closeAllMenus() {
    qsa(".io-more").forEach(function (el) {
      el.classList.remove("is-open");
    });
  }

  qsa(".io-more-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var wrap = btn.closest(".io-more");
      var open = wrap.classList.contains("is-open");
      closeAllMenus();
      if (!open) wrap.classList.add("is-open");
    });
  });
  document.addEventListener("click", closeAllMenus);

  qsa(".js-print").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      window.open(btn.dataset.href, "_blank");
    });
  });

  var limit = qs(".io-limit");
  if (limit) {
    limit.addEventListener("change", function () {
      var url = new URL(window.location.href);
      url.searchParams.set("limit", limit.value);
      url.searchParams.set("page", "1");
      window.location.href = url.toString();
    });
  }

  qsa(".io-filters select").forEach(function (el) {
    el.addEventListener("change", function () {
      qs(".io-filters").submit();
    });
  });

  var addBtn = qs("#io-add-btn");
  var pickerList = qs("#io-picker-list");
  var pickerQ = qs("#io-picker-q");
  var itemList = qs("#io-item-list");
  var itemEmpty = qs("#io-item-empty");
  var form = qs("#io-form");

  function selectedIds() {
    return qsa("input[name*='[componentId]']").map(function (input) {
      return String(input.value);
    });
  }

  function reindexItems() {
    qsa(".io-item-row").forEach(function (row, index) {
      qsa("input", row).forEach(function (input) {
        input.name = input.name.replace(/items\[\d+\]/, "items[" + index + "]");
      });
    });
    if (itemEmpty) {
      itemEmpty.classList.toggle("d-none", qsa(".io-item-row").length > 0);
    }
  }

  function addItem(data) {
    if (selectedIds().indexOf(String(data.id)) !== -1) {
      alert("Linh kiện này đã có trong phiếu");
      return;
    }
    var index = qsa(".io-item-row").length;
    var row = document.createElement("div");
    row.className = "io-item-row";
    row.innerHTML =
      '<input type="hidden" name="items[' + index + '][componentId]" value="' + data.id + '">' +
      '<div class="io-item-info"><div class="io-item-code">' + data.code + '</div><div class="io-item-name">' +
      data.name + '</div><div class="io-item-meta">' + data.category + " · Tồn kho hiện tại " + data.stock +
      '</div></div><div class="io-item-fields"><label><span>Số lượng</span><input class="io-input" type="number" min="0" name="items[' +
      index + '][quantity]" value="1" required></label><label><span>Đơn giá</span><input class="io-input" type="number" min="0" step="1000" name="items[' +
      index + '][unitPrice]" value="' + data.price + '" required></label><button class="io-del" type="button" title="Xóa"><i class="bi bi-trash"></i></button></div>';
    itemList.appendChild(row);
    reindexItems();
  }

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      openEl(pickerOverlay);
      openEl(picker);
    });
  }
  if (qs("#io-picker-close")) {
    qs("#io-picker-close").addEventListener("click", function () {
      closeEl(picker);
      closeEl(pickerOverlay);
    });
  }
  if (pickerOverlay) {
    pickerOverlay.addEventListener("click", function () {
      closeEl(picker);
      closeEl(pickerOverlay);
    });
  }
  if (pickerList) {
    qsa(".io-picker-item", pickerList).forEach(function (btn) {
      btn.addEventListener("click", function () {
        addItem(btn.dataset);
        closeEl(picker);
        closeEl(pickerOverlay);
      });
    });
  }
  if (pickerQ) {
    pickerQ.addEventListener("input", function () {
      var q = pickerQ.value.toLowerCase();
      qsa(".io-picker-item").forEach(function (item) {
        var hay = (item.dataset.code + " " + item.dataset.name).toLowerCase();
        item.style.display = hay.indexOf(q) === -1 ? "none" : "";
      });
    });
  }
  if (itemList) {
    itemList.addEventListener("click", function (e) {
      var del = e.target.closest(".io-del");
      if (!del) return;
      del.closest(".io-item-row").remove();
      reindexItems();
    });
  }

  if (form) {
    qsa("button[data-intent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        qs("#io-intent").value = btn.dataset.intent;
      });
    });
    form.addEventListener("submit", function (e) {
      if (!qsa(".io-item-row").length) {
        e.preventDefault();
        alert("Thêm ít nhất một linh kiện");
      }
    });
  }

  function openModal() {
    openEl(modalOverlay);
    openEl(modal);
  }
  function closeModal() {
    closeEl(modal);
    closeEl(modalOverlay);
  }
  if (qs("#io-open-confirm")) {
    qs("#io-open-confirm").addEventListener("click", openModal);
  }
  qsa(".js-close-modal").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);
})();
