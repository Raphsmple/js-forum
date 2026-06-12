API.me().then(() => { window.location.href = '/'; }).catch(() => {});

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('loginError');
        err.textContent = '';
        try {
            await API.login(document.getElementById('email').value, document.getElementById('password').value);
            window.location.href = '/';
        } catch (e) { err.textContent = e.message; }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('registerError');
        err.textContent = '';
        try {
            await API.register(
                document.getElementById('username').value,
                document.getElementById('email').value,
                document.getElementById('password').value
            );
            window.location.href = '/login.html';
        } catch (e) { err.textContent = e.message; }
    });
}
