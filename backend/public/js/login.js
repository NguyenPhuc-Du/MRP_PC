document.addEventListener("DOMContentLoaded", () => {
    const passwordToggles = document.querySelectorAll(".password-toggle");

    passwordToggles.forEach((toggleBtn) => {
        toggleBtn.addEventListener("click", () => {
            const targetSelector = toggleBtn.getAttribute("data-target");
            const passwordInput = document.querySelector(targetSelector);
            if (!passwordInput) return;

            const icon = toggleBtn.querySelector("i");
            const isPassword = passwordInput.getAttribute("type") === "password";

            // Chuyển đổi type của input
            passwordInput.setAttribute("type", isPassword ? "text" : "password");

            // Đổi icon tương ứng
            if (icon) {
                icon.classList.toggle("bi-eye-slash", !isPassword);
                icon.classList.toggle("bi-eye", isPassword);
            }
        });
    });
});