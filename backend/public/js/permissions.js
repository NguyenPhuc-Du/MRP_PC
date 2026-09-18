(function () {
  var tablePermissions = document.querySelector("[table-permissions]");
  var recordsEl = document.querySelector("[data-records]");
  var formChangePermissions = document.getElementById("form-change-permissions");
  var buttonSubmit = document.querySelector("[button-submit]");
  var buttonReset = document.querySelector("[button-reset]");

  if (!tablePermissions || !recordsEl) {
    return;
  }

  function parseRecords() {
    var raw = recordsEl.getAttribute("data-records");
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return [];
    }
  }

  function checkboxInputs(row) {
    return Array.prototype.slice.call(row.querySelectorAll('input[type="checkbox"]'));
  }

  function isViewRow(row) {
    var name = row.getAttribute("data-name") || "";
    return /_view$/.test(name);
  }

  function getGroups() {
    var groups = [];
    var current = [];

    Array.prototype.slice.call(tablePermissions.querySelectorAll("tbody tr")).forEach(function (row) {
      if (row.classList.contains("perm-group-row")) {
        if (current.length) {
          groups.push(current);
        }
        current = [];
        return;
      }

      var name = row.getAttribute("data-name");
      if (!name || name === "id") {
        return;
      }
      current.push(row);
    });

    if (current.length) {
      groups.push(current);
    }
    return groups;
  }

  function viewRow(group) {
    for (var i = 0; i < group.length; i += 1) {
      if (isViewRow(group[i])) {
        return group[i];
      }
    }
    return null;
  }

  function syncGroupColumn(group, index) {
    var view = viewRow(group);
    if (!view) {
      return;
    }

    var viewInput = checkboxInputs(view)[index];
    if (!viewInput) {
      return;
    }

    var enabled = viewInput.checked;
    group.forEach(function (row) {
      if (isViewRow(row)) {
        return;
      }
      var input = checkboxInputs(row)[index];
      if (!input) {
        return;
      }
      if (!enabled) {
        input.checked = false;
        input.disabled = true;
      } else {
        input.disabled = false;
      }
    });
  }

  function syncAllViewLocks() {
    getGroups().forEach(function (group) {
      var view = viewRow(group);
      if (!view) {
        return;
      }
      checkboxInputs(view).forEach(function (_input, index) {
        syncGroupColumn(group, index);
      });
    });
  }

  function applyRecords(records) {
    tablePermissions.querySelectorAll('tr[data-name] input[type="checkbox"]').forEach(function (input) {
      input.checked = false;
      input.disabled = false;
    });

    records.forEach(function (record, index) {
      (record.permissions || []).forEach(function (permission) {
        var row = tablePermissions.querySelector('tr[data-name="' + permission + '"]');
        if (!row) {
          return;
        }
        var inputs = checkboxInputs(row);
        if (inputs[index]) {
          inputs[index].checked = true;
        }
      });
    });

    syncAllViewLocks();
  }

  function collectPermissions(records) {
    var permissions = records.map(function (record) {
      return {
        id: record.id,
        permissions: [],
      };
    });

    tablePermissions.querySelectorAll("tbody tr[data-name]").forEach(function (row) {
      var name = row.getAttribute("data-name");
      if (!name || name === "id") {
        return;
      }

      checkboxInputs(row).forEach(function (input, index) {
        if (input.checked && !input.disabled && permissions[index]) {
          permissions[index].permissions.push(name);
        }
      });
    });

    return permissions;
  }

  var records = parseRecords();
  applyRecords(records);

  tablePermissions.addEventListener("change", function (event) {
    var input = event.target;
    if (!input || input.type !== "checkbox") {
      return;
    }

    var row = input.closest("tr[data-name]");
    if (!row || !isViewRow(row)) {
      return;
    }

    var index = checkboxInputs(row).indexOf(input);
    if (index < 0) {
      return;
    }

    var groups = getGroups();
    for (var i = 0; i < groups.length; i += 1) {
      if (groups[i].indexOf(row) !== -1) {
        syncGroupColumn(groups[i], index);
        break;
      }
    }
  });

  if (buttonSubmit && formChangePermissions) {
    buttonSubmit.addEventListener("click", function () {
      var inputPermissions = formChangePermissions.querySelector('input[name="permissions"]');
      inputPermissions.value = JSON.stringify(collectPermissions(records));
      formChangePermissions.submit();
    });
  }

  if (buttonReset) {
    buttonReset.addEventListener("click", function () {
      applyRecords(parseRecords());
    });
  }
})();
