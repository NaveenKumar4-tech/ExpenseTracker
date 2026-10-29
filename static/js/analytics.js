/* =====================================================================
   analytics.js  -  ANALYTICS page.
   IIFE-wrapped so it can run again on every visit. Chart.js is loaded once
   in base.html. Charts are destroyed when you leave the page.
   ===================================================================== */
(() => {
  "use strict";

  
  const toast = document.getElementById("toast")
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message || "";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 26000);
  }

  const lineCanvas = document.getElementById("expenseLineChart");
  const barCanvas = document.getElementById("expenseChart");
  if (!lineCanvas || !barCanvas) return; // not on the analytics page

  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded (check base.html).");
    showToast("Network error")
    return;
  }

  const { GenerateColor, registerPageCleanup } = window.App;

  const charts = [];
  let alive = true; // false once the user navigates away
  registerPageCleanup(() => {
    alive = false;
    charts.forEach((c) => c.destroy());
    charts.length = 0;
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


  function makeChart(canvas, config) {
    const existing = Chart.getChart(canvas); // canvas already in use?
    if (existing) existing.destroy();
    const chart = new Chart(canvas, config);
    charts.push(chart);
    return chart;
  }

  async function loadAnalytics() {
    try {
      const res = await authFetch("/api/all-transactions");
      if (!res) return;
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const json = await res.json();
      if (!alive) return;

      const expense = (json.data || []).filter((e) => e.type === "expense");

      const categories = [];
      const amounts = [];
      const monthlyTotal = {};

      expense.forEach((item) => {
        const month = new Date(item.date).toLocaleString("en-US", {
          month: "long",
          timeZone: "UTC",
        });
        amounts.push(item.amount);
        categories.push(item.note);
        monthlyTotal[month] = (monthlyTotal[month] || 0) + Number(item.amount);
      });

      const months = Object.keys(monthlyTotal);
      const lineAmounts = Object.values(monthlyTotal);
      const colors = GenerateColor(expense.length);

      /* ---------- line chart ---------- */
      makeChart(lineCanvas, {
        type: "line",
        data: {
          labels: months,
          datasets: [
            {
              label: "Monthly Expenses",
              data: lineAmounts,
              borderColor: "#4f46e5",
              backgroundColor: "rgba(79, 70, 229, 0.12)",
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 8,
              pointBackgroundColor: "#4f46e5",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { display: true, position: "top" },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  "Expenses: ₹" + ctx.parsed.y.toLocaleString("en-IN"),
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Expense Amount (₹)" },
              ticks: { callback: (v) => "₹" + v.toLocaleString("en-IN") },
            },
            x: {
              title: { display: true, text: "Month" },
              grid: { display: false },
            },
          },
        },
      });

      /* ---------- bar chart ---------- */
      makeChart(barCanvas, {
        type: "bar",
        data: {
          labels: categories,
          datasets: [
            {
              label: "Expenses (₹)",
              data: amounts,
              backgroundColor: colors,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "top" },
            tooltip: {
              callbacks: {
                label: (ctx) => "₹" + ctx.parsed.y.toLocaleString("en-IN"),
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Amount (₹)" },
              ticks: { callback: (v) => "₹" + v.toLocaleString("en-IN") },
            },
            x: {
              title: { display: true, text: "Expense Categories" },
              grid: { display: false },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }

  loadAnalytics();
})();
