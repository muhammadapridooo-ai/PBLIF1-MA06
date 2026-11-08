
// ==========================================
// 1. PEMERIKSAAN LOGIN
// ==========================================

const loggedInUser = sessionStorage.getItem("loggedInUser");

if (!loggedInUser) {
    window.location.href = "index.html";
}

const users = JSON.parse(localStorage.getItem("users")) || [];

const currentUser = users.find(function(user) {
    return user.username === loggedInUser;
});

if (!currentUser) {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

// Menampilkan nama pengguna
document.getElementById("userName").textContent =
    currentUser.nama + " ▾";


// ==========================================
// 2. PROSES LOGOUT
// ==========================================

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", function(event) {
    event.preventDefault();

    const confirmLogout = confirm(
        "Apakah Anda yakin ingin Logout?"
    );

    if (confirmLogout) {
        sessionStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
    }
});


// ==========================================
// 3. MENGAMBIL DATA DARI LOCAL STORAGE
// ==========================================

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Mengambil kendaraan milik akun yang sedang login
function getUserVehicles() {
    return getData("vehicles").filter(function(vehicle) {
        return vehicle.username === loggedInUser;
    });
}

// Mengambil riwayat servis milik akun yang sedang login
function getUserServices() {
    return getData("serviceRecords").filter(function(service) {
        return service.username === loggedInUser;
    });
}


// ==========================================
// 4. FUNGSI BANTUAN
// ==========================================

// Format angka menjadi Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(number) || 0);
}

// Mengubah tanggal menjadi format Indonesia
function formatTanggal(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// Mengurutkan servis dari tanggal terbaru
function sortServices(services) {
    return [...services].sort(function(a, b) {
        return String(b.date).localeCompare(String(a.date));
    });
}

// Membuat elemen tabel dengan aman
function createCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "-";
    row.appendChild(cell);
    return cell;
}


// ==========================================
// 5. MENAMPILKAN RINGKASAN DASHBOARD
// ==========================================

function displayStatistics(vehicles, services) {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Menghitung biaya servis pada bulan berjalan
    const monthlyServices = services.filter(function(service) {
        if (!service.date) {
            return false;
        }

        const serviceDate = new Date(
            service.date + "T00:00:00"
        );

        return (
            !isNaN(serviceDate.getTime()) &&
            serviceDate.getMonth() === currentMonth &&
            serviceDate.getFullYear() === currentYear
        );
    });

    const totalMonthlyCost = monthlyServices.reduce(
        function(total, service) {
            return total + (Number(service.cost) || 0);
        },
        0
    );

    // Mengambil servis paling baru
    const sortedServices = sortServices(services);

    const lastService = sortedServices.length > 0
        ? sortedServices[0]
        : null;

    document.getElementById("totalMonthlyCost").textContent =
        formatRupiah(totalMonthlyCost);

    document.getElementById("totalVehicles").textContent =
        vehicles.length + " Unit";

    document.getElementById("lastServiceDate").textContent =
        lastService
            ? formatTanggal(lastService.date)
            : "Belum ada servis";
}


// ==========================================
// 6. MENAMPILKAN DAFTAR KENDARAAN
// ==========================================

function displayVehicles(vehicles, services) {
    const tableBody = document.getElementById("vehicleTableBody");

    tableBody.innerHTML = "";

    if (vehicles.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "Belum ada kendaraan yang terdaftar.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    vehicles.forEach(function(vehicle, index) {
        const row = document.createElement("tr");

        // Mencari riwayat servis kendaraan
        const vehicleServices = sortServices(
            services.filter(function(service) {
                return service.vehicle === vehicle.plate;
            })
        );

        const lastService = vehicleServices.length > 0
            ? vehicleServices[0]
            : null;

        const lastServiceText = lastService
            ? lastService.serviceType + " – " +
              formatTanggal(lastService.date)
            : "Belum ada servis";

        // Kilometer terakhir dari catatan servis terbaru,
        // jika belum ada servis gunakan kilometer kendaraan.
        const lastKilometer = lastService
            ? lastService.kilometer
            : vehicle.kilometer;

        createCell(row, index + 1);
        createCell(row, vehicle.plate);
        createCell(row, vehicle.name);
        createCell(row, vehicle.year || "-");
        createCell(row, lastServiceText);

        createCell(
            row,
            lastKilometer !== undefined &&
            lastKilometer !== null &&
            lastKilometer !== ""
                ? Number(lastKilometer).toLocaleString("id-ID") + " km"
                : "-"
        );

        tableBody.appendChild(row);
    });
}


// ==========================================
// 7. MENAMPILKAN RIWAYAT SERVIS TERBARU
// ==========================================

function displayRecentServices(services) {
    const tableBody = document.getElementById("recentServiceBody");

    tableBody.innerHTML = "";

    const recentServices = sortServices(services).slice(0, 5);

    if (recentServices.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "Belum ada riwayat servis.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    recentServices.forEach(function(service) {
        const row = document.createElement("tr");

        createCell(row, formatTanggal(service.date));
        createCell(row, service.vehicle);
        createCell(row, service.serviceType);
        createCell(row, service.workshop);
        createCell(row, formatRupiah(service.cost));

        tableBody.appendChild(row);
    });
}


// ==========================================
// 8. PENCARIAN DASHBOARD
// ==========================================

function setupDashboardSearch(vehicles, services) {
    const searchInput = document.getElementById("dashboardSearch");

    searchInput.addEventListener("input", function() {
        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        const filteredVehicles = vehicles.filter(function(vehicle) {
            return [
                vehicle.plate,
                vehicle.name,
                vehicle.year
            ].some(function(value) {
                return String(value || "")
                    .toLowerCase()
                    .includes(keyword);
            });
        });

        const filteredServices = services.filter(function(service) {
            return [
                service.vehicle,
                service.serviceType,
                service.workshop,
                service.date,
                service.cost
            ].some(function(value) {
                return String(value || "")
                    .toLowerCase()
                    .includes(keyword);
            });
        });

        displayVehicles(filteredVehicles, services);
        displayRecentServices(filteredServices);
    });
}


// ==========================================
// 9. MEMUAT SELURUH DASHBOARD
// ==========================================

function loadDashboard() {
    const vehicles = getUserVehicles();
    const services = getUserServices();

    displayStatistics(vehicles, services);
    displayVehicles(vehicles, services);
    displayRecentServices(services);

    setupDashboardSearch(vehicles, services);
}

// Jalankan Dashboard
loadDashboard();
