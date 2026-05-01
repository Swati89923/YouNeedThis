const BASE_URL = "https://feedback-platform-backend-hwch.onrender.com";
const token = localStorage.getItem("token");

// 🔐 AUTH CHECK
if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
}

// 📌 Get projectId from URL
const params = new URLSearchParams(window.location.search);
const projectId = params.get("projectId");

if (!projectId) {
    alert("Invalid project");
    window.location.href = "dashboard.html";
}

// 🔙 Back
function goBack() {
    window.history.back();
}

// 🚪 Logout
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ✍️ Submit Feedback
async function submitFeedback() {
    const comment = document.getElementById("comment").value;
    const rating = document.getElementById("rating").value;
    const msg = document.getElementById("msg");

    if (!comment || !rating) {
        msg.innerText = "All fields are required";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                projectId: projectId,
                comment: comment,
                rating: rating
            })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.innerText = data.message || "Failed to submit feedback";
            return;
        }

        msg.innerText = "✅ Feedback submitted successfully!";
        document.getElementById("comment").value = "";
        document.getElementById("rating").value = "";

    } catch (err) {
        msg.innerText = "Network error";
    }
}
