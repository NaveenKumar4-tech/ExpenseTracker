/* =====================================================================
   common.js  -  shared helpers. Loaded ONCE from base.html (data-persist).
   Page scripts read what they need from window.App.
   ===================================================================== */
(() => {
  "use strict";
  if (window.App) return; // never initialise twice

  /* ---------- page cleanup registry ----------
     Page scripts call registerPageCleanup(fn) for anything that lives
     outside #page-content (document listeners, charts, timers).
     nav.js calls runPageCleanups() right before it swaps the page. */
  const cleanups = [];
  function registerPageCleanup(fn) {
    cleanups.push(fn);
  }
  function runPageCleanups() {
    while (cleanups.length) {
      try {
        cleanups.pop()();
      } catch (e) {
        console.error("Page cleanup failed:", e);
      }
    }
  }

  /* ---------- formatting ---------- */
  function money(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  const CATEGORY_ICONS = {
    Food: "fa-utensils",
    Transport: "fa-car",
    Shopping: "fa-bag-shopping",
    Bills: "fa-file-invoice",
    Other: "fa-box",
  };

  function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
  }

  function GenerateColor(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${(i * 360) / count},70%,55%)`);
    }
    return colors;
  }

  /* ---------- toast / spinner (null-safe) ---------- */
  let toastTimer;
  function ShowToast(message) {
    const toast = document.querySelector(".toast");
    if (!toast) return;
    toast.innerText = message || "";
    toast.classList.add("toast-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("toast-show"), 2500);
  }

  function Loadspinner() {
    const spinner = document.querySelector(".spinner");
    if (spinner) spinner.style.display = "block";
  }

  function Hidespinner() {
    const spinner = document.querySelector(".spinner");
    if (spinner) spinner.style.display = "none";
  }

  /* ---------- transaction row markup (shared by dashboard + transactions) ----------
     No inline onclick: pages use event delegation on ".delete-btn[data-id]". */
  function transactionHTML(t) {
    const income = t.type === "income";
    const bg = income ? "#e8f8f0" : "#f0edff";
    const fg = income ? "#20a76b" : "#6956e5";
    return `
      <div class="transaction">
        <div class="transaction-icon" style="background:${bg};color:${fg};">
          <i class="fa-solid ${getCategoryIcon(t.category_name || t.category)}"></i>
        </div>
        <div class="transaction-info">
          <strong>${escapeHtml(t.note)}</strong>
          <span>${escapeHtml(t.category_name)} • ${escapeHtml(t.date)}</span>
        </div>
        <div class="transaction-amount ${escapeHtml(t.type)}">
          ${income ? "+" : "-"}${money(t.amount)}
        </div>
        <button class="delete-btn" type="button" data-id="${escapeHtml(t.id)}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
  }

  function emptyHTML(message = "No transactions found.") {
    return `<div style="text-align:center;padding:40px;color:#999;font-size:12px;">${escapeHtml(message)}</div>`;
  }

  /* ---------- current user (fetched once, cached) ---------- */
  let userPromise = null;

  function displayName(username) {
    return String(username || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function getCurrentUser(force = false) {
    if (!userPromise || force) {
      userPromise = (async () => {
        try {
          const res = await authFetch("/api/users");
          if (!res || !res.ok) return null;
          const json = await res.json();
          const user = json.data && json.data[0];
          return user ? { ...user, displayName: displayName(user.username) } : null;
        } catch (e) {
          console.error("Could not load user:", e);
          return null;
        }
      })();
    }
    return userPromise;
  }

  // Sidebar lives in base.html and is never replaced, so fill it once here.
  async function refreshSidebarProfile(force = false) {
    const user = await getCurrentUser(force);
    if (!user) return;
    const name = document.querySelector(".sidebar .username");
    const avatar = document.querySelector(".sidebar .avatar");
    if (name) name.textContent = user.displayName;
    if (avatar) avatar.textContent = user.displayName.slice(0, 1);
  }

  window.App = {
    registerPageCleanup,
    runPageCleanups,
    money,
    escapeHtml,
    getCategoryIcon,
    GenerateColor,
    ShowToast,
    Loadspinner,
    Hidespinner,
    transactionHTML,
    emptyHTML,
    getCurrentUser,
    refreshSidebarProfile,
  };

  refreshSidebarProfile();
})();
