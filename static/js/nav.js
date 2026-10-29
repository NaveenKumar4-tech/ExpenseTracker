/* =====================================================================
   nav.js  -  sidebar page-to-page navigation without a full reload.
   Loaded ONCE from base.html (data-persist).
   ===================================================================== */
(() => {
  "use strict";
  if (window.__spaNav) return; // never install twice
  window.__spaNav = true;

  const SHARED_STYLES = ["/css/base.css", "font-awesome"];
  let controller = null;

  /* ---------- helpers ---------- */
  function normalizedPath(path) {
    const url = new URL(path, window.location.origin);
    return url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
  }

  function updateActiveLink(path = location.pathname) {
    const currentPath = normalizedPath(path);
    document.querySelectorAll(".sidebar .nav-item").forEach((link) => {
      const active = normalizedPath(link.href) === currentPath;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  const isSharedStyle = (href) => SHARED_STYLES.some((p) => href.includes(p));

  /* ---------- page CSS ----------
     Every non-shared stylesheet in <head> belongs to the current page.
     On navigation: add the new page's CSS first, swap content, then
     remove the old page's CSS (no unstyled flash, no CSS leaking). */
  function markInitialPageStyles() {
    document
      .querySelectorAll("head link[rel='stylesheet'], head style")
      .forEach((node) => {
        if (isSharedStyle(node.getAttribute("href") || "")) return;
        node.dataset.pageStyle = "true";
      });
  }

  async function prepareStyles(parsed) {
    const current = Array.from(document.querySelectorAll("[data-page-style]"));
    const keep = new Set();
    const loading = [];

    parsed
      .querySelectorAll("head link[rel='stylesheet'], head style")
      .forEach((node) => {
        const isLink = node.tagName === "LINK";
        const href = isLink
          ? new URL(node.getAttribute("href"), location.origin).href
          : "";
        if (isLink && isSharedStyle(href)) return;

        const match = current.find(
          (c) =>
            !keep.has(c) &&
            c.tagName === node.tagName &&
            (isLink ? c.href === href : c.textContent === node.textContent)
        );
        if (match) {
          keep.add(match);
          return;
        }

        const clone = node.cloneNode(true);
        clone.dataset.pageStyle = "true";
        if (isLink) {
          loading.push(
            new Promise((resolve) => {
              clone.onload = clone.onerror = resolve;
              setTimeout(resolve, 3000); // never hang on a slow stylesheet
            })
          );
        }
        document.head.appendChild(clone);
        keep.add(clone);
      });

    await Promise.all(loading);
    return () => current.forEach((c) => !keep.has(c) && c.remove());
  }

  /* ---------- page scripts ----------
     innerHTML never runs <script> tags, so we recreate them.
     Skipped: anything already loaded once (data-persist, nav.js, Chart.js). */
  function isJsType(script) {
    const type = (script.getAttribute("type") || "").toLowerCase();
    return !type || type === "text/javascript" || type === "module";
  }

  function isPersistent(script) {
    if (script.hasAttribute("data-persist")) return true;
    const src = script.getAttribute("src");
    if (!src) return false;
    const abs = new URL(src, location.origin).href;
    if (abs.includes("/js/nav.js")) return true;
    if (window.Chart && /chart(\.umd)?(\.min)?\.js/i.test(abs)) return true;
    return Array.from(
      document.querySelectorAll("script[data-persist][src]")
    ).some((s) => s.src === abs);
  }

  async function runPageScripts(parsed, isCurrent) {
    document
      .querySelectorAll("script[data-page-script]")
      .forEach((s) => s.remove());

    for (const old of parsed.querySelectorAll("body script")) {
      if (!isCurrent()) return; // user already clicked somewhere else
      if (!isJsType(old) || isPersistent(old)) continue;

      const script = document.createElement("script");
      script.dataset.pageScript = "true";

      const src = old.getAttribute("src");
      if (src) {
        script.src = new URL(src, location.origin).href;
        await new Promise((resolve) => {
          script.onload = resolve;
          script.onerror = () => {
            console.error("Failed to load", src);
            resolve();
          };
          document.body.appendChild(script);
        });
      } else {
        script.textContent = old.textContent;
        document.body.appendChild(script);
      }
    }
  }

  /* ---------- navigation ---------- */
  async function navigate(path, push = true) {
    const url = new URL(path, location.origin);
    if (url.origin !== location.origin) {
      location.href = url.href;
      return;
    }

    if (controller) controller.abort();
    const mine = (controller = new AbortController());
    const isCurrent = () => controller === mine;

    try {
      const response = await fetch(url.href, {
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal: mine.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Server sent us somewhere else (e.g. login) -> do a normal load.
      if (
        response.redirected &&
        normalizedPath(response.url) !== normalizedPath(url.href)
      ) {
        location.href = response.url;
        return;
      }

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const nextContent = parsed.querySelector("#page-content");
      const content = document.querySelector("#page-content");
      if (!nextContent || !content) {
        location.href = url.href;
        return;
      }
      if (!isCurrent()) return;

      // 1. let the old page tear down (charts, document listeners ...)
      if (window.App) window.App.runPageCleanups();

      // 2. load new CSS, swap content, drop old CSS
      const finishStyles = await prepareStyles(parsed);
      if (!isCurrent()) return;
      content.innerHTML = nextContent.innerHTML;
      finishStyles();

      document.title = parsed.title || "Expense Tracker";
      if (push) {
        history.pushState({ spa: true }, "", url.pathname + url.search + url.hash);
      }
      updateActiveLink(url.pathname);
      window.scrollTo(0, 0);

      // 3. start the new page's scripts (DOM is ready, so they run immediately)
      await runPageScripts(parsed, isCurrent);

      content.focus({ preventScroll: true });
      document.dispatchEvent(
        new CustomEvent("spa:page-loaded", { detail: { path: url.pathname } })
      );
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("SPA navigation failed; loading normally.", error);
      location.href = url.href;
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".sidebar a.nav-item, .sidebar a.logo");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;

    const url = new URL(link.href, location.origin);
    if (url.origin !== location.origin) return;

    event.preventDefault();
    if (url.pathname === location.pathname && url.search === location.search) return;
    navigate(url.href, true);
  });

  window.addEventListener("popstate", () => navigate(location.href, false));

  function init() {
    markInitialPageStyles();
    updateActiveLink();
    history.replaceState({ spa: true }, "", location.href);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.spaNavigate = (path) => navigate(path, true);
})();
