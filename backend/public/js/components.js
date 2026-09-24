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
//end pagination
//delete component
const deleteButton= document.querySelectorAll('[button-delete]');
if(deleteButton.length>0){
deleteButton.forEach(button =>{
    button.addEventListener("click",()=>{
        const id = button.getAttribute('data-id');
        const form = document.getElementById('form-delete-item');
        const path = form.getAttribute('data-path');
        const action=`${path}/${id}?_method=DELETE`;
        form.action=action;
        form.submit();
    })
})
}
//end delete component
const formSearch = document.getElementById('form-search');
if(formSearch){
    formSearch.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log(formSearch);
        const keyword = formSearch.querySelector('input[name="keyword"]').value;
        
        const url = new URL(window.location.href);
        if(keyword){
            url.searchParams.set('keyword', keyword);
        } else {
            url.searchParams.delete('keyword');
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
const formStatus = document.getElementById('form-status');
if(formStatus){
    formStatus.addEventListener('change', (e) => {

        const status = formStatus.value;
        console.log(status);
        const url= new URL(window.location.href);
        if(status){
            url.searchParams.set('status', status);
        } else {
            url.searchParams.delete('status');
        }
        window.location.href = url.toString();
        e.preventDefault();
    })
}
//end status
//prevent spam
const form = document.getElementById("form-create-component");
if (form) {
  form.addEventListener("submit", function () {
    const btn = form.querySelector('button[type="submit"]');
    if (btn.dataset.submitting === "1") {
      event.preventDefault();
      return;
    }
    btn.dataset.submitting = "1";
    btn.disabled = true;
    btn.querySelector("span").textContent = "Đang lưu...";
  });
}
//end prevent spam
