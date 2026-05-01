const BASE_URL = "https://feedback-platform-backend-hwch.onrender.com";

// 🔐 Get token
const token = localStorage.getItem("token");

if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
}

// 🔓 Decode JWT (frontend only)
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
        return null;
    }
}

const user = parseJwt(token);

if (!user) {
    localStorage.clear();
    alert("Invalid session. Please login again.");
    window.location.href = "index.html";
}

// 👤 Show user info
document.getElementById("userEmail").innerText = user.sub || "N/A";
document.getElementById("userRole").innerText = user.role || "N/A";

// 🎯 Role based UI
if (user.role === "DEVELOPER") {
    document.getElementById("developerSection").classList.remove("hidden");
}

if (user.role === "REVIEWER") {
    document.getElementById("reviewerSection").classList.remove("hidden");
}
// After setting userRole text
const roleBadge = document.getElementById("roleBadge");
if (roleBadge) {
    roleBadge.innerText = user.role;
}

// 🚪 LOGOUT (GLOBAL)
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// make sure onclick works
window.logout = logout;
