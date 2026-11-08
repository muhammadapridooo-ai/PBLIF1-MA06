
// ==========================================
// IDENTITAS PENGGUNA
// ==========================================

const loggedInUser = sessionStorage.getItem("loggedInUser");

if (!loggedInUser) {
    window.location.href = "index.html";
}

const users = JSON.parse(localStorage.getItem("users")) || [];

const currentUser = users.find(user =>
    user.username === loggedInUser
);

const userNameElement = document.getElementById("userName");

if (userNameElement && currentUser) {
    userNameElement.textContent = currentUser.nama + " ▾";
}

// Logout
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function(event) {
        event.preventDefault();

        if (confirm("Apakah Anda yakin ingin Logout?")) {
            sessionStorage.removeItem("loggedInUser");
            window.location.href = "index.html";
        }
    });
}

// ==========================================
// MENGAMBIL DATA MILIK PENGGUNA
// ==========================================

function getUserData(key) {
    const data = JSON.parse(localStorage.getItem(key)) || [];

    return data.filter(item =>
        item.username === loggedInUser
    );
}

function getServices() {
    return getUserData("serviceRecords");
}

function getVehicles() {
    return getUserData("vehicles");
}

// ==========================================
// FORMAT RUPIAH
// ==========================================

function formatRupiah(number) {
    return "Rp " + Number(number || 0).toLocaleString("id-ID");
}

// ==========================================
// FORMAT BULAN DAN TAHUN
// ==========================================

function formatPeriod(period) {
    const [year, month] = period.split("-");

    const date = new Date(
        Number(year),
        Number(month) - 1
    );

    return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
    });
}

// ==========================================
// RINGKASAN LAPORAN
// ==========================================

function displayReport() {
    const services = getServices();
    const vehicles = getVehicles();

    const totalCost = services.reduce(
        (total, service) =>
            total + Number(service.cost || 0),
        0
    );

    const totalTransactions = services.length;
    const totalVehicles = vehicles.length;

    document.getElementById("totalCost").textContent =
        formatRupiah(totalCost);

    document.getElementById("totalTransactions").textContent =
        totalTransactions;

    document.getElementById("totalVehicles").textContent =
        totalVehicles;

    displayPeriodSummary(services);
    displayServiceSummary(services);
}

// ==========================================
// RINGKASAN BERDASARKAN BULAN
// ==========================================

function displayPeriodSummary(services) {
    const tableBody = document.getElementById("periodSummaryBody");

    tableBody.innerHTML = "";

    const periodData = {};

    services.forEach(service => {
        if (!service.date) return;

        const period = service.date.substring(0, 7);

        if (!periodData[period]) {
            periodData[period] = {
                count: 0,
                total: 0
            };
        }

        periodData[period].count++;
        periodData[period].total += Number(service.cost || 0);
    });

    const periods = Object.keys(periodData).sort().reverse();

    if (periods.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "Belum ada data laporan.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    periods.forEach((period, index) => {
        const data = periodData[period];
        const row = document.createElement("tr");

        const values = [
            index + 1,
            formatPeriod(period),
            data.count,
            formatRupiah(data.total)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// ==========================================
// RINGKASAN BERDASARKAN JENIS SERVIS
// ==========================================

function displayServiceSummary(services) {
    const tableBody = document.getElementById("serviceSummaryBody");

    tableBody.innerHTML = "";

    const serviceData = {};

    services.forEach(service => {
        const type = service.serviceType || "Tidak diketahui";

        if (!serviceData[type]) {
            serviceData[type] = {
                count: 0,
                total: 0
            };
        }

        serviceData[type].count++;
        serviceData[type].total += Number(service.cost || 0);
    });

    const types = Object.keys(serviceData);

    if (types.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.textContent = "Belum ada data laporan.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    types.forEach((type, index) => {
        const data = serviceData[type];
        const row = document.createElement("tr");

        const values = [
            index + 1,
            type,
            data.count,
            formatRupiah(data.total)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Jalankan laporan
if (loggedInUser && currentUser) {
    displayReport();
}
