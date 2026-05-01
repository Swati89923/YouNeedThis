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

// 📋 Load My Feedback
async function loadMyFeedback() {
    const container = document.getElementById("feedbackContainer");
    container.innerText = "Loading feedback...";

    try {
        const res = await fetch(`${BASE_URL}/api/v1/feedback/my`, {
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
           container.innerHTML = `<div class="state">No feedback submitted yet.</div>`;
           return;
        }

        feedbacks.forEach(f => {
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <p><b>Project:</b> ${f.projectTitle || "N/A"}</p>
                <p><b>Rating:</b> ⭐ ${f.rating}</p>
                <p><b>Comment:</b> ${f.comment}</p>
                <p><small>${new Date(f.createdAt).toLocaleString()}</small></p>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        container.innerHTML = "<p>❌ Error loading feedback</p>";
    }
}

// 🚀 AUTO LOAD
loadMyFeedback();
