const BASE_URL = "https://feedback-platform-backend-hwch.onrender.com";

// 🔐 AUTH
const token = localStorage.getItem("token");
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

// 📋 Load Feedback on Developer Projects
async function loadProjectFeedback() {
    const container = document.getElementById("feedbackContainer");
    container.innerText = "Loading feedback...";

    try {
        const res = await fetch(`${BASE_URL}/api/v1/feedback/project-feedback`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to load feedback");
        }

        const feedbacks = await res.json();
        container.innerHTML = "";

        if (!feedbacks || feedbacks.length === 0) {
            container.innerHTML = "<p>No feedback received yet.</p>";
            return;
        }

        feedbacks.forEach(f => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <p><b>Project:</b> ${f.projectTitle}</p>
                <p><b>Reviewer:</b> ${f.reviewerEmail || "Anonymous"}</p>
                <p><b>Rating:</b> ⭐ ${f.rating}</p>
                <p><b>Comment:</b> ${f.comment}</p>
                <p><small>${new Date(f.createdAt).toLocaleString()}</small></p>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = "<p>❌ Error loading feedback</p>";
    }
}

// 🚀 AUTO LOAD
loadProjectFeedback();
