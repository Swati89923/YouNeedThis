const BASE_URL = "https://feedback-platform-backend-hwch.onrender.com";
const token = localStorage.getItem("token");

// 🔐 Auth check
if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
}

// 🔙 Dashboard
function goDashboard() {
    window.location.href = "dashboard.html";
}

// 🚪 Logout
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
window.logout = logout;

// ➡️ Open feedback page
function openFeedback(projectId) {
    window.location.href = `feedback.html?projectId=${projectId}`;
}
window.openFeedback = openFeedback;

// 📋 Load projects for reviewer
async function loadAvailableProjects() {
    const container = document.getElementById("projectsContainer");
    container.innerHTML = "<p>Loading projects...</p>";

    try {
        const res = await fetch(`${BASE_URL}/api/v1/projects`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Forbidden or endpoint issue");
        }

        const projects = await res.json();
        container.innerHTML = "";

        if (!projects || projects.length === 0) {
            container.innerHTML = "<p>No projects available.</p>";
            return;
        }

        projects.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h4>${p.title}</h4>
                <p class="muted">${p.description}</p>
                <p><b>Pay:</b> ₹${p.pricePerFeedback}</p>
                <span class="badge badge-status">OPEN</span>
                <div style="margin-top:10px">
                    <button onclick="openFeedback(${p.id})">Give Feedback</button>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML =
            "<p style='color:red'>❌ Error loading projects</p>";
    }
}

// 🚀 AUTO LOAD
loadAvailableProjects();
