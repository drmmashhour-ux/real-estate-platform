(function () {
  const API_URL = window.API_URL || "http://localhost:3001";
  const form = document.getElementById("loginForm");
  const loginSection = document.getElementById("loginSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const loginError = document.getElementById("loginError");
  const userEmail = document.getElementById("userEmail");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  function showError(msg) {
    loginError.textContent = msg || "";
    loginError.classList.toggle("hidden", !msg);
  }

  function showDashboard(email) {
    userEmail.textContent = email || "";
    loginSection.classList.add("hidden");
    dashboardSection.classList.add("visible");
  }

  function showLogin() {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.remove("visible");
    localStorage.removeItem("owner_accessToken");
    localStorage.removeItem("owner_user");
  }

  const saved = localStorage.getItem("owner_user");
  if (saved) {
    try {
      const user = JSON.parse(saved);
      showDashboard(user.email);
    } catch (_) {
      showLogin();
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!email || !password) return;
    loginBtn.disabled = true;
    showError("");
    try {
      const res = await fetch(API_URL + "/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error?.message || data.message || "Login failed");
        return;
      }
      if (data.accessToken) localStorage.setItem("owner_accessToken", data.accessToken);
      if (data.user) localStorage.setItem("owner_user", JSON.stringify(data.user));
      showDashboard(data.user?.email || email);
    } catch (err) {
      showError("Network error. Is the API running at " + API_URL + "?");
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", showLogin);
})();
