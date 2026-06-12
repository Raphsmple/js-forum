API.me().then(() => { window.location.href = '/'; }).catch(() => {});

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

function setBtnLoading(form, on) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.classList.toggle('btn-loading', on);
    btn.disabled = on;
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('loginError');
        err.textContent = '';
        setBtnLoading(loginForm, true);
        try {
            await API.login(document.getElementById('email').value, document.getElementById('password').value);
            window.location.href = '/';
        } catch (e) {
            err.textContent = e.message;
            setBtnLoading(loginForm, false);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('registerError');
        err.textContent = '';
        setBtnLoading(registerForm, true);
        try {
            await API.register(
                document.getElementById('username').value,
                document.getElementById('email').value,
                document.getElementById('password').value
            );
            window.location.href = '/login.html';
        } catch (e) {
            err.textContent = e.message;
            setBtnLoading(registerForm, false);
        }
    });
}
