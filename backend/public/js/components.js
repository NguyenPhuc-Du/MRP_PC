const paginationButton = document.querySelectorAll("[pagination-button]");
paginationButton.forEach((button) => {
  button.addEventListener("click", () => {
    const url = new URL(window.location.href);
    const page = button.getAttribute("data-page");
    if (page) {
      url.searchParams.set("page", page);
    } else {
      url.searchParams.delete("page");
    }
    window.location.href = url.toString();
  });
});
//end pagination
//delete component
const deleteButton = document.querySelectorAll("[button-delete]");
if (deleteButton.length > 0) {
  deleteButton.forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("Bạn có chắc muốn xoá linh kiện này?")) {
        return;
      }
      const id = button.getAttribute("data-id");
      const form = document.getElementById("form-delete-item");
      const path = form.getAttribute("data-path");
      const action = `${path}/${id}?_method=DELETE`;
      form.action = action;
      form.submit();
    });
  });
}
//end delete component
const formSearch = document.getElementById("form-search");
if (formSearch) {
  formSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyword = formSearch.querySelector('input[name="keyword"]').value;

    const url = new URL(window.location.href);
    if (keyword) {
      url.searchParams.set("keyword", keyword);
    } else {
      url.searchParams.delete("keyword");
    }
    window.location.href = url.toString();
  });
}
//preview ảnh
(function () {
  var input = document.getElementById("image");
  var img = document.getElementById("image-preview");
  var empty = document.getElementById("image-preview-empty");
  if (!input || !img) return;
  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    if (!file) return;
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
    if (empty) empty.style.display = "none";
  });
})();
//end preview ảnh
//status
const formStatus = document.getElementById("form-status");
if (formStatus) {
  formStatus.addEventListener("change", (e) => {
    const status = formStatus.value;
    const url = new URL(window.location.href);
    if (status) {
      url.searchParams.set("status", status);
    } else {
      url.searchParams.delete("status");
    }
    window.location.href = url.toString();
    e.preventDefault();
  });
}
//end status
//prevent spam create/edit
function preventDoubleSubmit(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", function (event) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    if (btn.dataset.submitting === "1") {
      event.preventDefault();
      return;
    }
    btn.dataset.submitting = "1";
    btn.disabled = true;
    const label = btn.querySelector("span");
    if (label) label.textContent = "Đang lưu...";
  });
}
preventDoubleSubmit("form-create-component");
preventDoubleSubmit("form-edit-component");
//end prevent spam
