(function () {
  function hideAlert(el) {
    el.classList.add('flash-hide');
    setTimeout(function () {
      var wrap = el.closest('.flash-wrap');
      if (wrap) wrap.remove();
      else el.remove();
    }, 200);
  }

  document.querySelectorAll('[show-alert]').forEach(function (alertEl) {
    var time = parseInt(alertEl.dataset.time, 10) || 5000;

    var timer = setTimeout(function () {
      hideAlert(alertEl);
    }, time);

    var closeBtn = alertEl.querySelector('[close-alert]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        clearTimeout(timer);
        hideAlert(alertEl);
      });
    }
  });
})();

(function () {
  var loader = document.getElementById('page-loader');
  var isLoading = false;

  function showLoading() {
    if (isLoading) return;
    isLoading = true;
    document.documentElement.classList.add('is-loading');
    if (loader) loader.hidden = false;
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    var href = link.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    showLoading();
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.hasAttribute('data-no-loading')) return;
    showLoading();
  });
})();

(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.sider a.nav-item[href]'));
  if (!items.length) return;

  function normalizePath(path) {
    if (!path) return '/';
    var pathname = path.split('?')[0].split('#')[0];
    if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/') {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  }

  function setActive(activeItem) {
    items.forEach(function (item) {
      item.classList.toggle('active', item === activeItem);
    });
  }

  function itemForPath(pathname) {
    var match = null;
    items.forEach(function (item) {
      var href = normalizePath(item.getAttribute('href'));
      if (pathname === href || pathname.indexOf(href + '/') === 0) {
        if (!match || href.length > normalizePath(match.getAttribute('href')).length) {
          match = item;
        }
      }
    });
    return match;
  }

  setActive(itemForPath(normalizePath(window.location.pathname)));

  items.forEach(function (item) {
    item.addEventListener('click', function () {
      setActive(item);
    });
  });
})();


document.addEventListener('DOMContentLoaded', function () {
  var editBtn = document.getElementById('btn-edit-profile');
  var cancelBtn = document.getElementById('btn-cancel-edit');
  var form = document.getElementById('form-profile');
  if (!editBtn || !form) return;

  var actions = form.querySelector('.profile-form-actions');
  // chỉ những field được phép sửa (có thuộc tính name), bỏ qua username/vai trò/trạng thái
  var editableInputs = form.querySelectorAll('.profile-field-input[name]');

  function setEditing(isEditing) {
    editableInputs.forEach(function (input) {
      input.disabled = !isEditing;
    });
    actions.classList.toggle('d-none', !isEditing);
    editBtn.classList.toggle('d-none', isEditing);
  }

  editBtn.addEventListener('click', function () {
    setEditing(true);
    if (editableInputs.length) editableInputs[0].focus();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      form.reset();
      setEditing(false);
    });
  }
});