/* =====================================================================
   accounts.js  -  ACCOUNTS page.
   IIFE-wrapped so it can run again on every visit. Every element lookup is
   null-safe, and the one document-level listener is removed on page leave.
   ===================================================================== */
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const on = (selector, event, handler) => {
    const el = $(selector);
    if (el) el.addEventListener(event, handler);
  };
  const setText = (selector, text) => {
    const el = $(selector);
    if (el) el.textContent = text;
  };

  const modalBackdrop = $("#modalBackdrop");
  const profileForm = $("#profileForm");
  if (!profileForm || !modalBackdrop) return; // not on the accounts page

  const { registerPageCleanup, getCurrentUser, refreshSidebarProfile } = window.App;

  const toast = $("#toast");
  let toastTimer;
  let alive = true; // false once the user navigates away
  let currentUser = null;
  let monthlyLimit = 20000;
  let totalSpent = 12450;
  let googleConnected = true;
  const account = { email: "naveenkumar@example.com" };

  registerPageCleanup(() => {
    alive = false;
    clearTimeout(toastTimer);
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message || "";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  
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


  /* ---------- profile ---------- */
  async function renderProfile(force = false) {
    const user = await getCurrentUser(force);
    if (!alive || !user) return;
    currentUser = user;

    const name = user.displayName;
    setText(".profileName", name);
    setText("#detailName", name);
    setText("#profileAvatar", name.slice(0, 1));
    setText("#profileEmail", user.email);
    setText("#detailEmail", user.email);
    setText("#detailDate", new Date(user.date_joined).toLocaleDateString());
    account.email = user.email;
  }

  function openProfileModal(title) {
    setText("#modalTitle", title);
    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    const firstInput = modalBackdrop.querySelector("input");
    if (firstInput) setTimeout(() => firstInput.focus(), 30);
  }

  function closeProfileModal() {
    modalBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  on("#editProfileButton", "click", () => {
    if (!currentUser) return;
    $("#nameInput").value = currentUser.username;
    $("#emailInput").value = currentUser.email;
    openProfileModal("Edit Profile");
  });

  on("#closeModalButton", "click", closeProfileModal);
  on("#cancelModalButton", "click", closeProfileModal);
  modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) closeProfileModal();
  });

  // document-level listener: must be removed when leaving the page
  const onEscape = (event) => {
    if (event.key === "Escape" && !modalBackdrop.hidden) closeProfileModal();
  };
  document.addEventListener("keydown", onEscape);
  registerPageCleanup(() => {
    document.removeEventListener("keydown", onEscape);
    document.body.style.overflow = "";
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const response = await authFetch("/api/users", {
        method: "PUT",
        body: JSON.stringify({
          username: $("#nameInput").value,
          email: $("#emailInput").value,
        }),
      });
      if (!response) return;
      const data = await response.json();

      if (!response.ok) {
        console.error("Update failed:", data);
        alert(data.message || "Failed to update profile");
        return;
      }

      alert("Profile updated successfully");
      closeProfileModal();
      await renderProfile(true); // refetch + refresh this page
      refreshSidebarProfile(); // sidebar uses the refreshed cache
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  });

  /* ---------- misc UI ---------- */
  on("#avatarButton", "click", () =>
    showToast("Your avatar uses your initials in this demo.")
  );

  function closeSidebar() {
    const sidebar = $("#sidebar");
    const backdrop = $("#sidebarBackdrop");
    const menu = $("#menuButton");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("show");
    if (menu) menu.setAttribute("aria-expanded", "false");
  }

  on("#menuButton", "click", () => {
    const sidebar = $("#sidebar");
    const backdrop = $("#sidebarBackdrop");
    const menu = $("#menuButton");
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle("open");
    if (backdrop) backdrop.classList.toggle("show", isOpen);
    if (menu) menu.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      $$(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      closeSidebar();
      if (link.textContent.trim() !== "Account") {
        showToast(`${link.textContent.trim()} page is a demo link.`);
      }
    });
  });

  on("#themeButton", "click", () => {
    document.body.classList.toggle("dark");
    showToast(
      document.body.classList.contains("dark")
        ? "Dark theme enabled."
        : "Light theme enabled."
    );
  });
  on("#notificationButton", "click", () => showToast("You're all caught up!"));
  on("#notificationsToggle", "change", (event) =>
    showToast(event.target.checked ? "Notifications enabled." : "Notifications disabled.")
  );
  on("#languageButton", "click", () =>
    showToast("Language preferences can be added here.")
  );
  on("#privacyButton", "click", () =>
    showToast("Privacy settings can be connected to your backend.")
  );
  on("#userMenuButton", "click", () => showToast(`Signed in as ${account.email}`));

  on("#googleConnectButton", "click", () => {
    googleConnected = !googleConnected;
    const button = $("#googleConnectButton");
    button.textContent = googleConnected ? "Connected" : "Connect";
    button.classList.toggle("disconnected", !googleConnected);
    setText("#googleStatus", googleConnected ? "Linked for quick login" : "Not connected");
    showToast(
      googleConnected
        ? "Google connection marked as connected."
        : "Google connection removed in this demo."
    );
  });

  /* ---------- budget ---------- */
  function renderBudget() {
    const percent =
      monthlyLimit > 0 ? Math.round((totalSpent / monthlyLimit) * 100) : 0;
    setText("#budgetAmount", `₹ ${monthlyLimit.toLocaleString("en-IN")}`);
    setText("#totalSpent", `₹ ${totalSpent.toLocaleString("en-IN")}`);
    setText("#budgetPercent", `${percent}% used`);
    const fill = $("#progressFill");
    if (fill) {
      fill.style.width = `${Math.min(percent, 100)}%`;
      fill.style.background =
        percent >= 100
          ? "linear-gradient(90deg,#ef3348,#d9233c)"
          : "linear-gradient(90deg,#0bb99c,#05a98e)";
    }
  }

  on("#editBudgetButton", "click", () => {
    const answer = prompt("Enter your monthly spending limit (₹):", String(monthlyLimit));
    if (answer === null) return;
    const amount = Number(answer.replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Please enter a valid limit greater than zero.");
      return;
    }
    monthlyLimit = Math.round(amount);
    renderBudget();
    showToast("Monthly spending limit updated.");
  });

  /* ---------- delete account ---------- */
  on("#deleteAccountButton", "click", async () => {
    if (!confirm("Delete your account?")) return;
    try {
      const res = await authFetch("/api/users", { method: "DELETE" });
      if (!res) return;
      console.log(await res.json());
      clearTokens();
      setTimeout(() => {
        window.location.href = "/login/";
      }, 1500);
    } catch (error) {
      console.error("Delete account failed:", error);
    }
  });

  on("#searchInput", "keydown", (event) => {
    if (event.key === "Enter" && event.target.value.trim()) {
      showToast(`Search ready for: ${event.target.value.trim()}`);
    }
  });

  /* ---------- start ---------- */
  renderProfile();
  renderBudget();
})();
