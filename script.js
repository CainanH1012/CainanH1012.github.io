document.addEventListener("DOMContentLoaded", () => {
    const newReportBtn = document.getElementById("newReportBtn");
    const reportFormContainer = document.getElementById("reportFormContainer");
    const reportForm = document.getElementById("reportForm");
    const timeDateInput = document.getElementById("timeDate");
    const personsContacted = document.getElementById("personsContacted");
    const vehiclesInfo = document.getElementById("vehiclesInfo");
    const addPersonBtn = document.getElementById("addPersonBtn");
    const addVehicleBtn = document.getElementById("addVehicleBtn");

    newReportBtn.addEventListener("click", () => {
        reportFormContainer.classList.toggle("hidden");
        timeDateInput.value = new Date().toLocaleString();
    });

    addPersonBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("personContacted");
        input.placeholder = "Username";
        personsContacted.appendChild(input);
    });

    addVehicleBtn.addEventListener("click", () => {
        const vehicleDiv = document.createElement("div");
        vehicleDiv.classList.add("vehicle");
        vehicleDiv.innerHTML = `
            <input type="text" class="vehicleMake" placeholder="Make">
            <input type="text" class="vehicleModel" placeholder="Model">
            <input type="text" class="vehicleColor" placeholder="Color">
            <input type="text" class="vehiclePlate" placeholder="Plate">
        `;
        vehiclesInfo.appendChild(vehicleDiv);
    });

    reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const reports = JSON.parse(localStorage.getItem("reports")) || [];
        const incidentNumber = String(reports.length + 1).padStart(6, '0');
        const report = {
            incidentNumber: incidentNumber,
            unitNumber: document.getElementById("unitNumber").value,
            unitUsername: document.getElementById("unitUsername").value,
            incidentType: document.getElementById("incidentType").value,
            timeDate: timeDateInput.value,
            locationPostal: document.getElementById("locationPostal").value,
            locationStreet: document.getElementById("locationStreet").value,
            personsContacted: Array.from(document.querySelectorAll(".personContacted")).map(input => input.value),
            vehiclesInfo: Array.from(document.querySelectorAll(".vehicle")).map(vehicle => ({
                make: vehicle.querySelector(".vehicleMake").value,
                model: vehicle.querySelector(".vehicleModel").value,
                color: vehicle.querySelector(".vehicleColor").value,
                plate: vehicle.querySelector(".vehiclePlate").value
            })),
            narrative: document.getElementById("narrative").value
        };

        saveReport(report);
        updateStatistics();
        reportForm.reset();
        reportFormContainer.classList.add("hidden");
        alert(`Incident ${incidentNumber} has been submitted.`);
    });

    function saveReport(report) {
        let reports = JSON.parse(localStorage.getItem("reports")) || [];
        reports.push(report);
        localStorage.setItem("reports", JSON.stringify(reports));
    }

    function updateStatistics() {
        const reports = JSON.parse(localStorage.getItem("reports")) || [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        document.getElementById("totalReports").textContent = reports.length;
        document.getElementById("reportsToday").textContent = reports.filter(report => new Date(report.timeDate) >= today).length;
        document.getElementById("reportsWeek").textContent = reports.filter(report => new Date(report.timeDate) >= weekAgo).length;
        document.getElementById("reportsMonth").textContent = reports.filter(report => new Date(report.timeDate) >= monthAgo).length;
    }

    updateStatistics();
});