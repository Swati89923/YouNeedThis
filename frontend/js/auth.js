const BASE_URL = "https://feedback-platform-backend-hwch.onrender.com";
let isLogin = true;

function toggleForm() {
  isLogin = !isLogin;

  document.getElementById("loginForm").style.display =
    isLogin ? "block" : "none";

  document.getElementById("signupForm").style.display =
    isLogin ? "none" : "block";

  document.getElementById("formTitle").innerText =
    isLogin ? "Login to continue" : "Create your account";

  document.getElementById("switchText").innerText =
    isLogin ? "New here? Create account" : "Already have an account? Login";

  document.getElementById("error").innerText = "";
}

/* ================= LOGIN ================= */

function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    document.getElementById("error").innerText =
      "Email and password required";
    return;
  }

  fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })
    .then(res => {
      if (!res.ok) throw new Error("Invalid credentials");
      return res.json();
    })
    .then(data => {
      // ✅ IMPORTANT
      localStorage.setItem("token", data.accessToken || data.token);
      localStorage.setItem("role", data.role);

      window.location.href = "dashboard.html";
    })
    .catch(err => {
      document.getElementById("error").innerText = err.message;
    });
}

/* ================= SIGNUP ================= */

async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("role").value.toUpperCase();

  if (!name || !email || !password || !role) {
    document.getElementById("error").innerText =
      "All fields are required";
    return;
  }

  const payload = { name, email, password, role };

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("error").innerText =
        data.message || "Signup failed";
      return;
    }

    alert("Signup successful 🎉 Please login");
    toggleForm(); // ✅ correct function

  } catch (err) {
    document.getElementById("error").innerText = "Network error";
  }
}
