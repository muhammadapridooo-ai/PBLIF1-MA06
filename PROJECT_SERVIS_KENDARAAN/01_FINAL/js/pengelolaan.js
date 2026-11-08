
/* ==========================================
   1. IDENTITAS PENGGUNA
========================================== */

const loggedInUser = sessionStorage.getItem("loggedInUser");

if (!loggedInUser) {
    window.location.href = "index.html";
}

const users = JSON.parse(localStorage.getItem("users")) || [];
const currentUser = users.find(user => user.username === loggedInUser);

if (!currentUser) {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

const userNameElement = document.getElementById("userName");

if (userNameElement) {
    userNameElement.textContent = currentUser.nama + " ▾";
}

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


/* ==========================================
   2. MENGAMBIL DAN MENYIMPAN DATA PER AKUN
========================================== */

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function getUserData(key) {
    return getData(key).filter(item =>
        item.username === loggedInUser
    );
}

function saveUserData(key, userData) {
    const allData = getData(key);

    const otherUsersData = allData.filter(item =>
        item.username !== loggedInUser
    );

    localStorage.setItem(
        key,
        JSON.stringify([...otherUsersData, ...userData])
    );
}

function getVehicles() {
    return getUserData("vehicles");
}

function getServiceTypes() {
    return getUserData("serviceTypes");
}

function getServices() {
    return getUserData("serviceRecords");
}


/* ==========================================
   3. MENGAMBIL ELEMEN HTML
========================================== */

const vehicleTableBody = document.getElementById("vehicleTableBody");
const serviceTypeTableBody = document.getElementById("serviceTypeTableBody");
const serviceTableBody = document.getElementById("serviceTableBody");

const vehicleFormPanel = document.getElementById("vehicleFormPanel");
const vehicleForm = document.getElementById("vehicleForm");
const vehicleFormTitle = document.getElementById("vehicleFormTitle");
const vehicleFormMessage = document.getElementById("vehicleFormMessage");

const serviceTypeFormPanel = document.getElementById("serviceTypeFormPanel");
const serviceTypeForm = document.getElementById("serviceTypeForm");
const serviceTypeFormTitle = document.getElementById("serviceTypeFormTitle");
const serviceTypeFormMessage = document.getElementById("serviceTypeFormMessage");

let editingVehicleId = null;
let editingServiceTypeId = null;


/* ==========================================
   4. FUNGSI BANTUAN
========================================== */

function createCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "-";
    row.appendChild(cell);
    return cell;
}

function createActionButton(text, className, callback, title) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.title = title;

    button.addEventListener("click", callback);

    return button;
}

function closeVehicleForm() {
    vehicleForm.reset();
    vehicleFormPanel.hidden = true;
    vehicleFormMessage.textContent = "";
    editingVehicleId = null;
}

function closeServiceTypeForm() {
    serviceTypeForm.reset();
    serviceTypeFormPanel.hidden = true;
    serviceTypeFormMessage.textContent = "";
    editingServiceTypeId = null;
}


/* ==========================================
   5. FORM TAMBAH / EDIT KENDARAAN
========================================== */

function openVehicleForm(vehicle = null) {
    closeServiceTypeForm();

    vehicleForm.reset();
    vehicleFormMessage.textContent = "";

    if (vehicle) {
        editingVehicleId = vehicle.id;

        vehicleFormTitle.textContent = "Edit Kendaraan";

        document.getElementById("vehiclePlate").value = vehicle.plate;
        document.getElementById("vehicleName").value = vehicle.name;
        document.getElementById("vehicleYear").value = vehicle.year;
        document.getElementById("vehicleKilometer").value = vehicle.kilometer;
    } else {
        editingVehicleId = null;
        vehicleFormTitle.textContent = "Tambah Kendaraan";
    }

    vehicleFormPanel.hidden = false;
    vehicleFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

document.getElementById("addVehicleButton").addEventListener("click", function() {
    openVehicleForm();
});

document.getElementById("cancelVehicleButton").addEventListener("click", function() {
    closeVehicleForm();
});

vehicleForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const plate = document.getElementById("vehiclePlate").value
        .trim().toUpperCase();

    const name = document.getElementById("vehicleName").value.trim();
    const year = document.getElementById("vehicleYear").value.trim();
    const kilometer = document.getElementById("vehicleKilometer").value.trim();

    if (!plate || !name || !year || !kilometer) {
        vehicleFormMessage.textContent = "Semua kolom harus diisi.";
        return;
    }

    if (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2100) {
        vehicleFormMessage.textContent = "Tahun kendaraan harus berupa 4 angka yang valid.";
        return;
    }

    if (kilometer === "" || !Number.isFinite(Number(kilometer)) || Number(kilometer) < 0) {
        vehicleFormMessage.textContent = "Kilometer harus berupa angka nol atau lebih.";
        return;
    }

    const vehicles = getVehicles();

    const duplicatePlate = vehicles.some(vehicle =>
        vehicle.plate.toUpperCase() === plate &&
        String(vehicle.id) !== String(editingVehicleId)
    );

    if (duplicatePlate) {
        vehicleFormMessage.textContent = "Nomor polisi tersebut sudah terdaftar.";
        return;
    }

    if (editingVehicleId !== null) {
        const vehicleIndex = vehicles.findIndex(vehicle =>
            String(vehicle.id) === String(editingVehicleId)
        );

        if (vehicleIndex === -1) {
            vehicleFormMessage.textContent = "Data kendaraan tidak ditemukan.";
            return;
        }

        const oldPlate = vehicles[vehicleIndex].plate;

        // Perbarui nomor polisi pada riwayat servis akun ini.
        const services = getServices();

        services.forEach(service => {
            if (service.vehicle === oldPlate) {
                service.vehicle = plate;
            }
        });

        saveUserData("serviceRecords", services);

        vehicles[vehicleIndex] = {
            ...vehicles[vehicleIndex],
            plate: plate,
            name: name,
            year: Number(year),
            kilometer: Number(kilometer)
        };

        saveUserData("vehicles", vehicles);

        alert("Data kendaraan berhasil diperbarui!");
    } else {
        vehicles.push({
            id: Date.now(),
            username: loggedInUser,
            plate: plate,
            name: name,
            year: Number(year),
            kilometer: Number(kilometer)
        });

        saveUserData("vehicles", vehicles);

        alert("Data kendaraan berhasil ditambahkan!");
    }

    closeVehicleForm();
    displayVehicles();
    displayServices();
    updateFilterOptions();
});


/* ==========================================
   6. MENAMPILKAN DATA KENDARAAN
========================================== */

function displayVehicles() {
    const vehicles = getVehicles();

    vehicleTableBody.innerHTML = "";

    if (vehicles.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell(row, "Belum ada data kendaraan.");
        cell.colSpan = 6;
        vehicleTableBody.appendChild(row);
        return;
    }

    vehicles.forEach((vehicle, index) => {
        const row = document.createElement("tr");

        createCell(row, index + 1);
        createCell(row, vehicle.plate);
        createCell(row, vehicle.name);
        createCell(row, vehicle.year);
        createCell(
            row,
            Number(vehicle.kilometer || 0).toLocaleString("id-ID") + " km"
        );

        const actionCell = document.createElement("td");
        actionCell.className = "action-buttons";

        const editButton = createActionButton(
            "✎",
            "edit-button",
            () => editVehicle(vehicle.id),
            "Edit kendaraan"
        );

        const deleteButton = createActionButton(
            "✕",
            "delete-button",
            () => deleteVehicle(vehicle.id),
            "Hapus kendaraan"
        );

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        vehicleTableBody.appendChild(row);
    });
}

function editVehicle(id) {
    const vehicle = getVehicles().find(item =>
        String(item.id) === String(id)
    );

    if (vehicle) {
        openVehicleForm(vehicle);
    }
}


/* ==========================================
   7. HAPUS KENDARAAN
========================================== */

function deleteVehicle(id) {
    const vehicles = getVehicles();

    const vehicle = vehicles.find(item =>
        String(item.id) === String(id)
    );

    if (!vehicle) return;

    const hasHistory = getServices().some(service =>
        service.vehicle === vehicle.plate
    );

    if (hasHistory) {
        alert("Kendaraan tidak dapat dihapus karena masih memiliki riwayat servis.");
        return;
    }

    if (!confirm("Apakah kamu yakin ingin menghapus kendaraan " + vehicle.plate + "?")) {
        return;
    }

    const updatedVehicles = vehicles.filter(item =>
        String(item.id) !== String(id)
    );

    saveUserData("vehicles", updatedVehicles);

    displayVehicles();
    updateFilterOptions();

    alert("Data kendaraan berhasil dihapus!");
}


/* ==========================================
   8. FORM TAMBAH / EDIT JENIS SERVIS
========================================== */

function openServiceTypeForm(type = null) {
    closeVehicleForm();

    serviceTypeForm.reset();
    serviceTypeFormMessage.textContent = "";

    if (type) {
        editingServiceTypeId = type.id;

        serviceTypeFormTitle.textContent = "Edit Jenis Servis";

        document.getElementById("serviceTypeName").value = type.name;
        document.getElementById("serviceTypeDescription").value = type.description;
    } else {
        editingServiceTypeId = null;
        serviceTypeFormTitle.textContent = "Tambah Jenis Servis";
    }

    serviceTypeFormPanel.hidden = false;
    serviceTypeFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

document.getElementById("addServiceTypeButton").addEventListener("click", function() {
    openServiceTypeForm();
});

document.getElementById("cancelServiceTypeButton").addEventListener("click", function() {
    closeServiceTypeForm();
});

serviceTypeForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("serviceTypeName").value.trim();
    const description = document.getElementById("serviceTypeDescription").value.trim();

    if (!name || !description) {
        serviceTypeFormMessage.textContent = "Semua kolom harus diisi.";
        return;
    }

    const types = getServiceTypes();

    const duplicateName = types.some(type =>
        type.name.toLowerCase() === name.toLowerCase() &&
        String(type.id) !== String(editingServiceTypeId)
    );

    if (duplicateName) {
        serviceTypeFormMessage.textContent = "Jenis servis tersebut sudah terdaftar.";
        return;
    }

    if (editingServiceTypeId !== null) {
        const typeIndex = types.findIndex(type =>
            String(type.id) === String(editingServiceTypeId)
        );

        if (typeIndex === -1) {
            serviceTypeFormMessage.textContent = "Jenis servis tidak ditemukan.";
            return;
        }

        const oldName = types[typeIndex].name;

        // Perbarui nama jenis servis pada riwayat akun ini.
        const services = getServices();

        services.forEach(service => {
            if (service.serviceType === oldName) {
                service.serviceType = name;
            }
        });

        saveUserData("serviceRecords", services);

        types[typeIndex] = {
            ...types[typeIndex],
            name: name,
            description: description
        };

        saveUserData("serviceTypes", types);

        alert("Jenis servis berhasil diperbarui!");
    } else {
        types.push({
            id: Date.now(),
            username: loggedInUser,
            name: name,
            description: description
        });

        saveUserData("serviceTypes", types);

        alert("Jenis servis berhasil ditambahkan!");
    }

    closeServiceTypeForm();
    displayServiceTypes();
    displayServices();
    updateFilterOptions();
});


/* ==========================================
   9. MENAMPILKAN JENIS SERVIS
========================================== */

function displayServiceTypes() {
    const types = getServiceTypes();

    serviceTypeTableBody.innerHTML = "";

    if (types.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell(row, "Belum ada data jenis servis.");
        cell.colSpan = 4;
        serviceTypeTableBody.appendChild(row);
        return;
    }

    types.forEach((type, index) => {
        const row = document.createElement("tr");

        createCell(row, index + 1);
        createCell(row, type.name);
        createCell(row, type.description);

        const actionCell = document.createElement("td");
        actionCell.className = "action-buttons";

        const editButton = createActionButton(
            "✎",
            "edit-button",
            () => editServiceType(type.id),
            "Edit jenis servis"
        );

        const deleteButton = createActionButton(
            "✕",
            "delete-button",
            () => deleteServiceType(type.id),
            "Hapus jenis servis"
        );

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        serviceTypeTableBody.appendChild(row);
    });
}

function editServiceType(id) {
    const type = getServiceTypes().find(item =>
        String(item.id) === String(id)
    );

    if (type) {
        openServiceTypeForm(type);
    }
}


/* ==========================================
   10. HAPUS JENIS SERVIS
========================================== */

function deleteServiceType(id) {
    const types = getServiceTypes();

    const type = types.find(item =>
        String(item.id) === String(id)
    );

    if (!type) return;

    const hasHistory = getServices().some(service =>
        service.serviceType === type.name
    );

    if (hasHistory) {
        alert("Jenis servis tidak dapat dihapus karena masih digunakan dalam riwayat servis.");
        return;
    }

    if (!confirm("Apakah kamu yakin ingin menghapus jenis servis " + type.name + "?")) {
        return;
    }

    const updatedTypes = types.filter(item =>
        String(item.id) !== String(id)
    );

    saveUserData("serviceTypes", updatedTypes);

    displayServiceTypes();
    updateFilterOptions();

    alert("Jenis servis berhasil dihapus!");
}


/* ==========================================
   11. FILTER KENDARAAN DAN JENIS SERVIS
========================================== */

function updateFilterOptions() {
    const vehicleFilter = document.getElementById("filterVehicle");
    const typeFilter = document.getElementById("filterServiceType");

    const selectedVehicle = vehicleFilter.value;
    const selectedType = typeFilter.value;

    vehicleFilter.innerHTML = '<option value="">Semua Kendaraan</option>';

    getVehicles().forEach(vehicle => {
        const option = document.createElement("option");

        option.value = vehicle.plate;
        option.textContent = vehicle.plate;

        vehicleFilter.appendChild(option);
    });

    typeFilter.innerHTML = '<option value="">Semua Jenis Servis</option>';

    getServiceTypes().forEach(type => {
        const option = document.createElement("option");

        option.value = type.name;
        option.textContent = type.name;

        typeFilter.appendChild(option);
    });

    vehicleFilter.value = selectedVehicle;
    typeFilter.value = selectedType;
}


/* ==========================================
   12. FORMAT TANGGAL
========================================== */

function formatDate(date) {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


/* ==========================================
   13. MENAMPILKAN RIWAYAT SERVIS
========================================== */

function displayServices() {
    const services = getServices();

    const keyword = document.getElementById("searchWorkshop").value.toLowerCase();
    const vehicle = document.getElementById("filterVehicle").value;
    const serviceType = document.getElementById("filterServiceType").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    const filteredServices = services.filter(service => {
        const matchKeyword =
            (service.workshop || "").toLowerCase().includes(keyword);

        const matchVehicle =
            vehicle === "" || service.vehicle === vehicle;

        const matchServiceType =
            serviceType === "" || service.serviceType === serviceType;

        const matchStartDate =
            startDate === "" || service.date >= startDate;

        const matchEndDate =
            endDate === "" || service.date <= endDate;

        return matchKeyword &&
            matchVehicle &&
            matchServiceType &&
            matchStartDate &&
            matchEndDate;
    });

    serviceTableBody.innerHTML = "";

    if (filteredServices.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell(row, "Tidak ada data servis yang sesuai dengan filter.");
        cell.colSpan = 8;
        serviceTableBody.appendChild(row);
        return;
    }

    filteredServices.forEach((service, index) => {
        const row = document.createElement("tr");

        createCell(row, index + 1);
        createCell(row, formatDate(service.date));
        createCell(row, service.vehicle);
        createCell(
            row,
            Number(service.kilometer || 0).toLocaleString("id-ID")
        );
        createCell(row, service.serviceType);
        createCell(row, service.workshop);
        createCell(
            row,
            "Rp " + Number(service.cost || 0).toLocaleString("id-ID")
        );

        const actionCell = document.createElement("td");
        actionCell.className = "action-buttons";

        const editButton = createActionButton(
            "✎",
            "edit-button",
            () => editService(service.id),
            "Edit riwayat servis"
        );

        const deleteButton = createActionButton(
            "✕",
            "delete-button",
            () => deleteService(service.id),
            "Hapus riwayat servis"
        );

        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        serviceTableBody.appendChild(row);
    });
}


/* ==========================================
   14. EDIT DAN HAPUS RIWAYAT SERVIS
========================================== */

function deleteService(id) {
    if (!confirm("Apakah kamu yakin ingin menghapus data servis ini?")) {
        return;
    }

    const services = getServices();

    const updatedServices = services.filter(service =>
        String(service.id) !== String(id)
    );

    saveUserData("serviceRecords", updatedServices);

    displayServices();
}

function editService(id) {
    const service = getServices().find(item =>
        String(item.id) === String(id)
    );

    if (!service) {
        alert("Data servis tidak ditemukan.");
        return;
    }

    localStorage.setItem("editingServiceId", id);
    window.location.href = "form.html";
}


/* ==========================================
   15. MENGAKTIFKAN FILTER
========================================== */

document.getElementById("searchWorkshop")
    .addEventListener("input", displayServices);

document.getElementById("filterVehicle")
    .addEventListener("change", displayServices);

document.getElementById("filterServiceType")
    .addEventListener("change", displayServices);

document.getElementById("startDate")
    .addEventListener("change", displayServices);

document.getElementById("endDate")
    .addEventListener("change", displayServices);

document.getElementById("clearFilters")
    .addEventListener("click", function() {
        document.getElementById("searchWorkshop").value = "";
        document.getElementById("filterVehicle").value = "";
        document.getElementById("filterServiceType").value = "";
        document.getElementById("startDate").value = "";
        document.getElementById("endDate").value = "";

        displayServices();
    });


/* ==========================================
   16. MENAMPILKAN DATA SAAT HALAMAN DIBUKA
========================================== */

if (loggedInUser && currentUser) {
    displayVehicles();
    displayServiceTypes();
    updateFilterOptions();
    displayServices();
}
