import { loadState, updateTheme } from "./storage.js";
import { updateDashboard } from "./dashboard.js";
import { setupSellForm } from "./sell.js";
import { setupExpenseForm } from "./expenses.js";
import { setupReports } from "./reports.js";
import { setupCoach } from "./coach.js";
import { setupSettings } from "./settings.js";
import { setupAiCoach } from "./ai-coach.js";
import { setupCustomers } from "./customers.js";
import { setupTimer } from "./timer.js";

const menuItems = [
  ["home-screen", "⌂", "Home"],
  ["sell-screen", "＋", "Sell"],
  ["expenses-screen", "₵", "Expenses"],
  ["customers-screen", "♙", "Customers"],
  ["timer-screen", "⏱", "Timer"],
  ["coach-screen", "★", "Coach"],
  ["reports-screen", "▥", "Reports"],
  ["settings-screen", "⚙", "Settings"]
];

document.addEventListener("DOMContentLoaded", () => {
  applyBranding();
  loadUpgradeDesign();
  loadAnimationDesign();
  loadBrandDesign();
  loadMenuDesign();
  loadTimerDesign();
  applySavedTheme();
  addSettingsNavigation();
  setupCustomers();
  setupTimer();
  setupNavigation();
  setupMenu();
  setupThemeToggle();
  setupThemeSettings();
  setupSellForm();
  setupExpenseForm();
  setupReports();
  setupCoach();
  setupSettings();
  setupAiCoach();
  updateDashboard();
  registerServiceWorker();
});

function applyBranding() {
  document.title = "Manfred Welch's Gummies";

  const heading = document.querySelector(".app-header h1");
  if (heading) {
    heading.textContent = "Manfred Welch's Gummies";
  }

  const header = document.querySelector(".app-header");

  if (header && !document.querySelector(".brand-logo")) {
    const logo = document.createElement("span");
    logo.className = "brand-logo";
    logo.textContent = "MW";
    logo.setAttribute("aria-label", "Manfred Welch's Gummies logo");
    header.prepend(logo);
  }
}

function loadUpgradeDesign() {
  loadStylesheet("./app-upgrade.css", "app-upgrade");
}

function loadAnimationDesign() {
  loadStylesheet("./animations.css", "animations");
}

function loadBrandDesign() {
  loadStylesheet("./brand.css", "brand");
}

function loadMenuDesign() {
  loadStylesheet("./menu.css", "menu");
}

function loadTimerDesign() {
  loadStylesheet("./timer.css", "timer");
}

function loadStylesheet(href, dataName) {
  if (document.querySelector(`link[data-style="${dataName}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.style = dataName;
  document.head.appendChild(link);
}

function addSettingsNavigation() {
  const navigation = document.querySelector(".bottom-nav");

  if (navigation) {
    navigation.style.display = "none";
  }
}

function setupMenu() {
  const header = document.querySelector(".app-header");
  if (!header || document.querySelector(".menu-toggle")) return;

  const menuButton = document.createElement("button");
  menuButton.className = "menu-toggle";
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", "Open navigation menu");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.textContent = "☰";

  const drawer = document.createElement("aside");
  drawer.className = "menu-drawer";
  drawer.setAttribute("aria-label", "Navigation menu");

  drawer.innerHTML = `
    <div class="menu-title">Manfred's Menu</div>
    ${menuItems
      .map(
        ([screenId, icon, label]) => `
          <button class="menu-link" type="button" data-menu-screen="${screenId}">
            <span class="menu-link-icon">${icon}</span>
            <span>${label}</span>
          </button>
        `
      )
      .join("")}
  `;

  document.body.append(menuButton, drawer);

  menuButton.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.textContent = isOpen ? "×" : "☰";
  });

  drawer.querySelectorAll("[data-menu-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.menuScreen);
      closeMenu(menuButton, drawer);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu(menuButton, drawer);
    }
  });
}

function closeMenu(menuButton, drawer) {
  drawer.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.textContent = "☰";
}

function setupNavigation() {
  document.querySelectorAll(".navigate-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.screen) {
        showScreen(button.dataset.screen);
      }
    });
  });
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active-screen", screen.id === screenId);
  });

  document.querySelectorAll(".menu-link").forEach((button) => {
    button.classList.toggle(
      "active-menu-link",
      button.dataset.menuScreen === screenId
    );
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupThemeToggle() {
  const button = document.querySelector("#theme-toggle");

  if (button) {
    button.style.display = "none";
  }
}

function setupThemeSettings() {
  const settingsForm = document.querySelector("#settings-form");
  if (!settingsForm || document.querySelector("#theme-setting")) return;

  const section = document.createElement("article");
  section.id = "theme-setting";
  section.className = "panel";

  section.innerHTML = `
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Appearance</p>
        <h2>Theme</h2>
      </div>
    </div>
    <label for="theme-choice">Choose app theme</label>
    <select id="theme-choice">
      <option value="light">Light mode</option>
      <option value="dark">Dark mode</option>
    </select>
  `;

  settingsForm.insertAdjacentElement("afterend", section);

  const choice = document.querySelector("#theme-choice");
  choice.value = loadState().theme;

  choice.addEventListener("change", () => {
    const nextTheme = choice.value;
    document.body.classList.toggle("dark-mode", nextTheme === "dark");
    updateTheme(nextTheme);
  });
}

function applySavedTheme() {
  const isDark = loadState().theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);

  const button = document.querySelector("#theme-toggle");

  if (button) {
    button.textContent = isDark ? "☀" : "☾";
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.warn("Offline support is not available yet:", error);
  }
}