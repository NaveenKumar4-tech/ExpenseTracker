/* =====================================================================
   transactions.js  -  TRANSACTIONS page.
   IIFE-wrapped so it can run again on every visit. Shared helpers come
   from common.js via window.App.
   ===================================================================== */
(() => {
  "use strict";

  const box = document.getElementById("transactions-box");
  if (!box) return; // not on the transactions page

  const {
    ShowToast,
    Loadspinner,
    Hidespinner,
    transactionHTML,
    emptyHTML,
    registerPageCleanup,
  } = window.App;
  
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


  const search = document.getElementById("search");

  let allTransactions = [];
  let alive = true; // false once the user navigates away
  registerPageCleanup(() => {
    alive = false;
  });

  function render() {
    const q = search ? search.value.trim().toLowerCase() : "";
    const items = q
      ? allTransactions.filter(
          (t) =>
            String(t.note || "").toLowerCase().includes(q) ||
            String(t.category_name || "").toLowerCase().includes(q)
        )
      : allTransactions;

    box.innerHTML = items.length
      ? items.map(transactionHTML).join("")
      : emptyHTML(q ? "No transactions found." : "No Transactions Found");
    console.log(allTransactions)
    }

  async function loadTransactions() {
    Loadspinner();
    try {
      const res = await authFetch("/api/all-transactions");
      if (!res) return;
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const json = await res.json();
      console.log(json)
      if (!alive) return;

      allTransactions = json.data || [];
      render();
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      if (alive) Hidespinner();
    }
    console.log(allTransactions)

  function FilterbyDate(){
  const DateFilter = document.getElementById("DateFilter")
    let today = new Date()
    let Currentmonth = today.getMonth()
    let Currentyear = today.getFullYear()
    console.log(Currentyear)
     
    let FilteredData = allTransactions.filter(item => {
      let date = new Date(item.date)
      let month = date.getMonth()
      let year = date.getFullYear()
      // console.log(date,month,year)
      if(DateFilter.value === "all"){
        return true
      }
      else if(DateFilter.value === "this_month"){
        // DateFilter.value 
        return month === Currentmonth && year === Currentyear
      }
       else if(DateFilter.value === "last_month"){
        // DateFilter.value 
        let last_month = new Date(Currentyear,Currentmonth-1,1)
        console.log(last_month)
        return month === last_month.getMonth() && year === last_month.getFullYear()
      }
      
    })
    console.log(FilteredData)
    box.innerHTML = FilteredData.length ? FilteredData.map(transactionHTML).join("") 
    : emptyHTML("No transactions found " );
  }
  DateFilter.addEventListener("change",FilterbyDate)
  }

  

  // event delegation: no inline onclick, no global deleteTransaction needed
  box.addEventListener("click", async (e) => {
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
      await loadTransactions();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  });

  if (search) search.oninput = render; // property, so it can never stack

  loadTransactions();


})();
