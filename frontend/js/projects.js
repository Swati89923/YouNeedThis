const BASE_URL = "https://feedback-platform-backend-hwch.onrender.com";
const token = localStorage.getItem("token");

// 🔐 AUTH CHECK
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

// ➕ Create Project
async function createProject() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const price = document.getElementById("price").value.trim();
    const msg = document.getElementById("msg");

    if (!title || !description || !price) {
        msg.innerText = "❌ All fields are required";
        msg.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/v1/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                description: description,
                pricePerFeedback: price
            })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.innerText = data.message || "Failed to create project";
            msg.style.color = "red";
            return;
        }

        msg.innerText = "✅ Project created successfully";
        msg.style.color = "green";

        document.getElementById("title").value = "";
        document.getElementById("description").value = "";
        document.getElementById("price").value = "";

        loadMyProjects();

    } catch (err) {
        msg.innerText = "❌ Network error";
        msg.style.color = "red";
    }
}

// 📋 Load My Projects
async function loadMyProjects() {
    const list = document.getElementById("projectList");
    list.innerHTML = "<li>Loading...</li>";

    try {
        const res = await fetch(`${BASE_URL}/api/v1/projects/my`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const projects = await res.json();
        list.innerHTML = "";

        if (!projects || projects.length === 0) {
            list.innerHTML = "<li>No projects created yet</li>";
            return;
        }

        projects.forEach(p => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${p.title}</strong><br>
                ${p.description}<br>
                💰 ₹${p.pricePerFeedback}
                <hr>
            `;
            list.appendChild(li);
        });

    } catch (err) {
        list.innerHTML = "<li>Error loading projects</li>";
    }
}

// 🚀 AUTO LOAD
loadMyProjects();
