
// ==========================================
// 1. PEMERIKSAAN LOGIN
// ==========================================

const loggedInUser = sessionStorage.getItem("loggedInUser");

if (!loggedInUser) {
    window.location.href = "index.html";
}

// ==========================================
// 2. MENAMPILKAN NAMA LENGKAP PENGGUNA
// ==========================================

const users = JSON.parse(localStorage.getItem("users")) || [];

const currentUser = users.find(user =>
    user.username === loggedInUser
);

const userNameElement = document.getElementById("userName");

if (userNameElement) {
    userNameElement.textContent =
        (currentUser ? currentUser.nama : loggedInUser) + " ▾";
}

// ==========================================
// 3. TOMBOL LOGOUT
// ==========================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function() {
        sessionStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
    });
}

// ==========================================
// 4. MENGAMBIL ELEMEN FORM
// ==========================================

const serviceForm = document.getElementById("serviceForm");
const formMessage = document.getElementById("formMessage");

const editId = localStorage.getItem("editingServiceId");

// ==========================================
// 5. MENGAMBIL DATA SERVIS
// ==========================================

function getServices() {
    return JSON.parse(localStorage.getItem("serviceRecords")) || [];
}

function getUserServices() {
    return getServices().filter(item =>
        item.username === loggedInUser
    );
}

// ==========================================
// 6. MEMUAT DATA KENDARAAN
// ==========================================

function loadVehicles() {
    const vehicleSelect = document.getElementById("vehicle");

    if (!vehicleSelect) return;

    const vehicles = (
        JSON.parse(localStorage.getItem("vehicles")) || []
    ).filter(item => item.username === loggedInUser);

    vehicleSelect.innerHTML =
        '<option value="">Pilih Kendaraan</option>';

    vehicles.forEach(vehicle => {
        const option = document.createElement("option");

        option.value = vehicle.plate;
        option.textContent =
            vehicle.plate + " - " + vehicle.name;

        vehicleSelect.appendChild(option);
    });
}

// ==========================================
// 7. MEMUAT JENIS SERVIS
// ==========================================

function loadServiceTypes() {
    const serviceSelect = document.getElementById("serviceType");

    if (!serviceSelect) return;

    const types = (
        JSON.parse(localStorage.getItem("serviceTypes")) || []
    ).filter(item => item.username === loggedInUser);

    serviceSelect.innerHTML =
        '<option value="">Pilih Jenis Servis</option>';

    types.forEach(type => {
        const option = document.createElement("option");

        option.value = type.name;
        option.textContent = type.name;

        serviceSelect.appendChild(option);
    });
}

// ==========================================
// 8. MEMUAT PILIHAN FORM
// ==========================================

loadVehicles();
loadServiceTypes();

// ==========================================
// 9. MENGISI FORM SAAT EDIT DATA
// ==========================================

if (editId) {
    const service = getUserServices().find(
        item => String(item.id) === editId
    );

    if (service) {
        document.getElementById("vehicle").value = service.vehicle;
        document.getElementById("date").value = service.date;
        document.getElementById("kilometer").value = service.kilometer;
        document.getElementById("serviceType").value = service.serviceType;
        document.getElementById("workshop").value = service.workshop;
        document.getElementById("cost").value = service.cost;
        document.getElementById("notes").value = service.notes || "";
    } else {
        localStorage.removeItem("editingServiceId");

        alert(
            "Data servis tidak ditemukan atau bukan milik akun Anda."
        );
    }
}

// ==========================================
// 10. MENYIMPAN DAN MEMPERBARUI DATA SERVIS
// ==========================================

if (serviceForm) {
    serviceForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const vehicle = document.getElementById("vehicle").value;
        const date = document.getElementById("date").value;
        const kilometer = document.getElementById("kilometer").value;
        const serviceType = document.getElementById("serviceType").value;
        const workshop = document.getElementById("workshop").value;
        const cost = document.getElementById("cost").value;
        const notes = document.getElementById("notes").value;

        if (!vehicle || !serviceType) {
            formMessage.textContent =
                "Silakan daftarkan kendaraan dan jenis servis terlebih dahulu.";

            formMessage.style.color = "red";
            return;
        }

        let services = getServices();

        const serviceData = {
            username: loggedInUser,
            vehicle: vehicle,
            date: date,
            kilometer: Number(kilometer),
            serviceType: serviceType,
            workshop: workshop,
            cost: Number(cost),
            notes: notes
        };

        // MODE EDIT
        if (editId) {
            const index = services.findIndex(item =>
                String(item.id) === editId &&
                item.username === loggedInUser
            );

            if (index === -1) {
                formMessage.textContent =
                    "Data servis tidak ditemukan.";

                formMessage.style.color = "red";
                return;
            }

            services[index] = {
                ...services[index],
                ...serviceData
            };

            formMessage.textContent =
                "Data servis berhasil diperbarui!";

        } else {
            // MODE TAMBAH DATA BARU
            serviceData.id = Date.now();

            services.push(serviceData);

            formMessage.textContent =
                "Data servis berhasil disimpan!";
        }

        // SIMPAN KE LOCAL STORAGE
        localStorage.setItem(
            "serviceRecords",
            JSON.stringify(services)
        );

        formMessage.style.color = "green";

        // BERSIHKAN STATUS EDIT
        localStorage.removeItem("editingServiceId");

        // KOSONGKAN FORM
        serviceForm.reset();

        // MUAT ULANG PILIHAN
        loadVehicles();
        loadServiceTypes();
    });
}
