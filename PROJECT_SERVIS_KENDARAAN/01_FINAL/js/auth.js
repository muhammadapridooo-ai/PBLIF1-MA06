
// Mengambil data akun yang tersimpan
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

// Menangani proses registrasi
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        message.style.display = "block";
        message.style.color = "red";

        if (password !== confirmPassword) {
            message.textContent = "Konfirmasi password tidak sama!";
            return;
        }

        const users = getUsers();

        const usernameExists = users.some(function(user) {
            return user.username.toLowerCase() === username.toLowerCase();
        });

        if (usernameExists) {
            message.textContent = "Username sudah digunakan!";
            return;
        }

        const newUser = {
            nama: nama,
            username: username,
            password: password
        };

        users.push(newUser);

        localStorage.setItem("users", JSON.stringify(users));

        message.style.color = "green";
        message.textContent = "Registrasi berhasil! Silakan login.";

        registerForm.reset();
    });
}

// Menangani proses login
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const errorMessage = document.getElementById("errorMessage");

    // Pesan kesalahan disembunyikan saat halaman pertama dibuka
    errorMessage.style.display = "none";

    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const users = getUsers();

        const foundUser = users.find(function(user) {
            return user.username.toLowerCase() === username.toLowerCase()
                && user.password === password;
        });

        if (foundUser) {
            sessionStorage.setItem("loggedInUser", foundUser.username);

            window.location.href = "dashboard.html";

            // Dashboard akan kita buat pada tahap berikutnya
        } else {
            errorMessage.style.display = "block";
        }
    });
}
