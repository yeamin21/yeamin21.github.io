"use strict";

/* -----------------------------------------------------------
   Yeamin Mahmud — Portfolio behaviour
   ----------------------------------------------------------- */

const GITHUB_USER = "yeamin21";

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  initThemeToggle();
  initHeaderScroll();
  initMobileNav();
  initReveal();
  initCounters();
  loadProjects();
});

/* ---------- Footer year ---------- */
function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ---------- Theme toggle (persisted) ---------- */
function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const icon = toggle?.querySelector(".theme-icon");

  const stored = localStorage.getItem("theme");
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  const initial = stored || (prefersLight ? "light" : "dark");
  applyTheme(initial);

  toggle?.addEventListener("click", () => {
    const next =
      root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";
  }
}

/* ---------- Sticky header style on scroll ---------- */
function initHeaderScroll() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const onScroll = () =>
    header.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Mobile navigation ---------- */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  const close = () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", close)
  );
}

/* ---------- Reveal-on-scroll animations ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !items.length) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Animated stat counters ---------- */
function initCounters() {
  const nums = document.querySelectorAll(".stat-num");
  if (!nums.length) return;

  const animate = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    nums.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  nums.forEach((el) => observer.observe(el));
}

/* ---------- Load GitHub projects ---------- */
async function loadProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`
    );
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    const repos = await res.json();

    const visible = repos
      .filter((r) => !r.fork && !r.archived)
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at) - new Date(a.pushed_at)
      )
      .slice(0, 6);

    grid.innerHTML = "";

    if (!visible.length) {
      grid.appendChild(emptyState());
      return;
    }

    visible.forEach((repo) => grid.appendChild(projectCard(repo)));
  } catch (err) {
    console.error("Could not load projects:", err);
    grid.innerHTML = "";
    grid.appendChild(emptyState(true));
  }
}

function projectCard(repo) {
  const card = document.createElement("article");
  card.className = "project-card";

  const desc = repo.description || "No description provided.";
  const lang = repo.language
    ? `<span class="project-lang"><span class="dot"></span>${escapeHtml(
        repo.language
      )}</span>`
    : "";
  const stars =
    repo.stargazers_count > 0
      ? `<span class="project-stars">★ ${repo.stargazers_count}</span>`
      : "";

  card.innerHTML = `
    <div class="project-top">
      <span class="project-icon" aria-hidden="true">📁</span>
      ${stars}
    </div>
    <h3>${escapeHtml(repo.name)}</h3>
    <p>${escapeHtml(desc)}</p>
    <div class="project-meta">
      ${lang}
      <a class="project-link" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
        View repo →
      </a>
    </div>
  `;
  return card;
}

function emptyState(isError = false) {
  const div = document.createElement("div");
  div.className = "projects-empty";
  div.innerHTML = isError
    ? `Couldn't load projects right now. Browse them directly on
       <a href="https://github.com/${GITHUB_USER}?tab=repositories" target="_blank" rel="noopener noreferrer">GitHub</a>.`
    : `No public repositories yet — check back soon, or visit
       <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener noreferrer">my GitHub</a>.`;
  return div;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
