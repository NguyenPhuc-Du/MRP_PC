(function () {
  function hideAlert(el) {
    el.classList.add('alert-hide');
    setTimeout(function () { el.remove(); }, 250);
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
