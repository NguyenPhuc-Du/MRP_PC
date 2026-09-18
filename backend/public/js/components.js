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

