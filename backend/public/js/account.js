document.querySelectorAll('.password-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var input = document.querySelector(btn.dataset.target);
        var icon = btn.querySelector('i');
        var isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        icon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
});

document.getElementById('form-edit-account').addEventListener('submit', function (e) {
    var pass = document.getElementById('password').value;
    var confirm = document.getElementById('confirmPassword').value;
    if (pass || confirm) {
        if (pass !== confirm) {
            e.preventDefault();
            alert('Mật khẩu xác nhận không khớp!');
        }
    }
});

document.getElementById('form-create-account').addEventListener('submit', function (e) {
    var pass = document.getElementById('password').value;
    var confirm = document.getElementById('confirmPassword').value;
    if (pass !== confirm) {
        e.preventDefault();
        alert('Mật khẩu xác nhận không khớp!');
    }
});
