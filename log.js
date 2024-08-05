document.addEventListener("DOMContentLoaded", () => {
    const passwordContainer = document.getElementById("passwordContainer");
    const logContainer = document.getElementById("logContainer");
    const passwordBtn = document.getElementById("passwordBtn");
    const passwordInput = document.getElementById("password");
    const passwordError = document.getElementById("passwordError");
    const logsList = document.getElementById("logsList");

    passwordBtn.addEventListener("click", () => {
        const password = passwordInput.value;
        if (password === "ERLCLogs") {
            passwordContainer.classList.add("hidden");
            logContainer.classList.remove("hidden");
            populateLogs();
        } else {
            passwordError.classList.remove("hidden");
        }
    });

    function populateLogs() {
        const reports = JSON.parse(localStorage.getItem("reports")) || [];
        logsList.innerHTML = "";
        reports.forEach(report => {
            const logBox = document.createElement("div");
            logBox.classList.add("log-box");
            logBox.textContent = `Incident ${report.incidentNumber}`;
            logBox.addEventListener("click", () => showLogDetails(report));
            logsList.appendChild(logBox);
        });
    }

    function showLogDetails(report) {
        alert(`Incident ${report.incidentNumber}\n\nUnit Number: ${report.unitNumber}\nUnit Username: ${report.unitUsername}\nIncident Type: ${report.incidentType}\nTime & Date: ${report.timeDate}\nLocation: ${report.locationPostal} / ${report.locationStreet}\nPersons Contacted: ${report.personsContacted.join(", ")}\nVehicles Info: ${report.vehiclesInfo.map(vehicle => `${vehicle.make} ${vehicle.model} (${vehicle.color}) - ${vehicle.plate}`).join(", ")}\nNarrative: ${report.narrative}`);
    }
});
