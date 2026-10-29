/* =====================================================================
   script.js  -  DASHBOARD page.
   Wrapped in an IIFE: no top-level const/let/function leaks to the global
   scope, so it can safely run again every time you navigate back here.
   Shared helpers come from common.js via window.App.
   ===================================================================== */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const form = $("transactionForm");
  if (!form) return; // not on the dashboard

  const {
    money,
    ShowToast,
    Loadspinner,
    Hidespinner,
    GenerateColor,
    transactionHTML,
    emptyHTML,
    registerPageCleanup,
    getCurrentUser,
  } = window.App;

  const modalForm = $("modalForm");
  const modal = $("modal");
  const openModal = $("openModal");
  const closeModal = $("closeModal");
  const period = $("period");
  const search = $("search");
  const list = $("transactions");
  const donut = document.querySelector(".donut");
  const legend = document.querySelector(".legend");
  const chartTotal = $("chartTotal");

  let allTransactions = [];
  let alive = true; // false once the user navigates away
  registerPageCleanup(() => {
    alive = false;
  });

  /* ---------- greeting ---------- */
  getCurrentUser().then((user) => {
    const greet = $("greet");
    if (alive && greet && user) greet.textContent = user.displayName;
  });

  // ------------ sidebar show --------------
  const sidebarBtn = document.querySelector(".sidebar-btn")
  const sidebar = document.querySelector(".sidebar")

  sidebarBtn.addEventListener("click",function(){
    sidebar.classList.toggle("sidebar-show")
  })
  
  document.addEventListener("pointerdown",(e)=>{
    if(!sidebarBtn.contains(e.target) && !sidebar.contains(e.target) ){
      console.log("working")
      sidebar.classList.remove("sidebar-show")
    }
  })

  const sidebarLinks = sidebar.querySelectorAll("a")

  sidebarLinks.forEach(link=>{
    link.addEventListener("click",() =>{
      sidebar.classList.remove("sidebar-show")
    })
  })



  /* ---------- summary cards ---------- */
  function renderSummary(data) {
    const set = (id, value) => {
      const el = $(id);
      if (!el) return;
      el.classList.remove("skeleton");
      el.innerHTML = `<h2> &#8377; ${value} </h2>`;
    };
    set("income", data.total_income);
    set("expenses", data.total_expense);
    set("balance", data.balance);
    set("savings", data.balance);
  }

  /* ---------- recent transactions (+ search) ---------- */
  function renderRecent() {
    const q = search.value.trim().toLowerCase();
    const items = q
      ? allTransactions.filter(
          (t) =>
            String(t.note || "").toLowerCase().includes(q) ||
            String(t.category_name || "").toLowerCase().includes(q)
        )
      : allTransactions.slice(0, 5);

    list.innerHTML = items.length
      ? items.map(transactionHTML).join("")
      : emptyHTML();
  }

  /* ---------- donut chart (+ period filter) ---------- */
  function expensesForPeriod() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const last = new Date(y, now.getMonth() - 1, 1);
    const ly = last.getFullYear();
    const lm = String(last.getMonth() + 1).padStart(2, "0");

    const prefix = {
      this_month: `${y}-${m}`,
      last_month: `${ly}-${lm}`,
      this_year: `${y}-`,
    }[period.value];

    return allTransactions.filter(
      (t) =>
        t.type === "expense" && (!prefix || String(t.date).startsWith(prefix))
    );
  }

  function renderChart() {
    const totals = {};
    expensesForPeriod().forEach((t) => {
      totals[t.category_name] = (totals[t.category_name] || 0) + Number(t.amount);
    });
    const rows = Object.entries(totals).map(([category_name, amount]) => ({
      category_name,
      amount,
    }));
    const total = rows.reduce((sum, r) => sum + r.amount, 0);

    chartTotal.innerText = `₹ ${total}`;

    if (!rows.length || total === 0) {
      donut.style.background = "#e8e8ed";
      legend.innerHTML = "";
      return;
    }

    const colors = GenerateColor(rows.length);
    let degree = 0;
    const stops = rows.map((r, i) => {
      const start = degree;
      degree += (r.amount / total) * 360;
      return `${colors[i]} ${start}deg ${degree}deg`;
    });
    donut.style.background = `conic-gradient(${stops.join(", ")})`;

    legend.innerHTML = rows
      .map(
        (r, i) => `
        <div class="legend-item">
          <span class="legend-color" style="background:${colors[i]}"></span>
          <div>
            <strong>${r.category_name}</strong>
            <small>₹ ${r.amount}</small>
          </div>
        </div>`
      )
      .join("");
  }

  /* ---------- load everything (one request) ---------- */
  async function loadDashboard() {
    Loadspinner();
    try {
      const res = await authFetch("/api/transaction");
      if (!res) return;
      const data = await res.json();
      if (!alive) return;
      if (!res.ok) {
        console.error("API error:", data);
        return;
      }
      allTransactions = data.data || [];
      renderSummary(data);
      renderRecent();
      renderChart();
    } catch (e) {
      console.error("Transaction request failed:", e);
      if (alive) ShowToast("Network Error");
    } finally {
      if (alive) Hidespinner();
    }
  }

  /* ---------- categories ---------- */
  async function loadCategories() {
    try {
      const res = await authFetch("/api/category");
      if (!res) return;
      const response = await res.json();
      if (!alive) return;
      const options = (response.data || [])
        .map((opt) => `<option value="${opt.id}"> ${opt.type} </option>`)
        .join("");
      $("category").innerHTML = options;
      $("modalCategory").innerHTML = options;
    } catch (e) {
      console.error("Could not load categories:", e);
    }
  }

  /* ---------- add / delete ---------- */
  async function addTransaction(description, amount, type, category, date) {
    const endpoint = type === "expense" ? "/api/expense/" : "/api/income/";
    try {
      const res = await authFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ amount, description, type, category, date }),
      });
      if (!res) return;
      const response = await res.json();
      if (!alive) return;
      ShowToast(response.message);
      await loadDashboard();
    } catch (e) {
      console.error("Add transaction failed:", e);
      if (alive) ShowToast("Network Error");
    }
  }

  list.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    try {
      const res = await authFetch(`/api/transaction/${btn.dataset.id}`, {
        method: "DELETE",
      });
      if (!res) return;
      const data = await res.json();
      if (!alive) return;
      ShowToast(data.message);
      await loadDashboard();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  });

  /* ---------- forms ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTransaction(
      $("description").value,
      $("amount").value,
      $("type").value,
      $("category").value,
      $("date").value
    );
    form.reset();
  });

  modalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTransaction(
      $("modalDescription").value,
      $("modalAmount").value,
      $("modalType").value,
      $("modalCategory").value,
      $("modalDate").value
    );
    modalForm.reset();
    modal.classList.remove("show");
  });

  /* ---------- modal ---------- */
  openModal.addEventListener("click", () => modal.classList.add("show"));
  closeModal.addEventListener("click", () => modal.classList.remove("show"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });

  /* ---------- search + period (plain properties: can never stack) ---------- */
  search.oninput = renderRecent;
  period.onchange = renderChart;

  /* ---------- start ---------- */
  loadCategories();
  loadDashboard();
})();
