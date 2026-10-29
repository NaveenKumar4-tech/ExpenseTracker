// ---------- Config ----------

// ---------- Token helpers ----------
function saveTokens(tokens) {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
}

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ---------- UI helper ----------
function showMessage(boxId, text, type) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = text;
  box.className = "message-box " + type;
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => el.remove());
}

function showFieldErrors(form, errors) {
  clearFieldErrors(form);
  Object.entries(errors).forEach(([field, msgs]) => {
    const input = form.querySelector(`[name="${field}"]`);
    const message = Array.isArray(msgs) ? msgs[0] : msgs;
    if (input) {
      const span = document.createElement("span");
      span.className = "field-error";
      span.textContent = message;
      input.parentElement.appendChild(span);
    }
  });
}

// ---------- Signup ----------
async function handleSignup(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector(".btn-submit");
  submitBtn.disabled = true;
  clearFieldErrors(form);

  const payload = {
    username: form.username.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    confirm_password: form.confirm_password.value,
  };

  try {
    const res = await fetch("/api/auth/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      saveTokens(data.tokens);
      showMessage("form-message", "Signup successful! Redirecting...", "success");
      setTimeout(() => (window.location.href = "/login/"), 900);
    } else if (typeof data === "object") {
      showFieldErrors(form, data);
      showMessage("form-message", "Please fix the errors below.", "error");
    }
  } catch (err) {
    showMessage("form-message", "Network error. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// ---------- Login ----------
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector(".btn-submit");
  submitBtn.disabled = true;
  clearFieldErrors(form);

  const payload = {
    username: form.username.value.trim(),
    password: form.password.value,
  };

  try {
    const res = await fetch("/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      saveTokens(data.tokens);
      showMessage("form-message", "Login successful! Redirecting...", "success");
      setTimeout(() => (window.location.href = "/dashboard/"), 900);
    } else {
      const errorText =
        data.non_field_errors?.[0] || data.detail || "Invalid username or password.";
      showMessage("form-message", errorText, "error");

      setTimeout(()=>{
      document.querySelector(".message-box").innerHTML = "";
      document.querySelector(".message-box").classList.remove("error");
      },3000)
    }
  } catch (err) {
    showMessage("form-message", "Network error. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// ---------- Authenticated fetch with auto-refresh ----------
async function authFetch(url, options = {}) {
  let accessToken = getAccessToken();
  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  let res = await fetch(url, options);

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      options.headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(url, options);
    } else {
      clearTokens();
      window.location.href = "/login/";
      return null;
    }
  }
  return res;
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("access_token", data.access);
    return true;
  } catch {
    return false;
  }
}

// ---------- Logout ----------
async function handleLogout() {
  const refresh = getRefreshToken();
  try {
    await authFetch("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  } finally {
    clearTokens();
    window.location.href = "/login/";
  }
}

// ---------- Attach listeners ----------
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  if (signupForm) signupForm.addEventListener("submit", handleSignup);

  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
});
