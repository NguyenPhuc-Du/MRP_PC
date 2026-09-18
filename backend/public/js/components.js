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
