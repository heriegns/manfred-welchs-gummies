// coach.js
// This file gives practical tips using your saved sales data.

import {
  calculateSaleProfit,
  getTotalProfitForSales,
  sumPieces
} from "./calculations.js";

import {
  formatCurrency,
  getSales,
  getSettings
} from "./storage.js";

export function setupCoach() {
  renderCoach();
}

export function renderCoach() {
  const headline = document.querySelector("#coach-headline");
  const summary = document.querySelector("#coach-summary");
  const tipsContainer = document.querySelector("#coach-tips");
  const locationsContainer = document.querySelector("#location-ranking");

  if (!headline || !summary || !tipsContainer || !locationsContainer) return;

  const sales = getSales();
  const settings = getSettings();

  if (sales.length === 0) {
    headline.textContent = "Your coach is ready";
    summary.textContent = "Log some sales and I will find useful patterns.";
    tipsContainer.innerHTML =
      '<p class="empty-state">Tips will appear after you record sales.</p>';
    locationsContainer.innerHTML =
      '<p class="empty-state">Location rankings will appear after you record sales.</p>';
    return;
  }

  const totalPieces = sumPieces(sales);
  const totalProfit = getTotalProfitForSales(sales, settings);
  const bestTime = findBestTime(sales, settings);
  const bestLocation = findBestLocation(sales, settings);
  const averagePieces = totalPieces / sales.length;

  headline.textContent = bestLocation
    ? `Try ${bestLocation.name} more often`
    : "Keep building your sales record";

  summary.textContent =
    `You have sold ${totalPieces} pieces and earned ${formatCurrency(totalProfit)} profit.`;

  const tips = [
    `Your average sale is ${averagePieces.toFixed(1)} pieces. Ask customers if they want one more.`,
    bestTime
      ? `Your strongest time so far is ${bestTime.name}, with ${bestTime.pieces} pieces sold.`
      : "Record more times of day to discover your strongest selling time.",
    bestLocation
      ? `${bestLocation.name} is your best location so far, with ${bestLocation.pieces} pieces sold.`
      : "Record locations consistently so the app can compare them.",
    totalPieces < settings.dailyTargetPieces
      ? `You are below the daily target of ${settings.dailyTargetPieces} pieces. Try a short selling session today.`
      : "You have reached your daily target. Keep the streak going.",
    averagePieces >= 3
      ? "A small deal such as 3 pieces for GHC 14 may encourage larger purchases."
      : "Focus on friendly introductions and ask customers how many pieces they want."
  ];

  tipsContainer.innerHTML = tips
    .map((tip) => `<div class="list-item"><span>${escapeHtml(tip)}</span></div>`)
    .join("");

  renderLocationRanking(sales, settings, locationsContainer);
}

function findBestTime(sales, settings) {
  const totals = {};

  sales.forEach((sale) => {
    const time = sale.timeOfDay || "Unknown";
    totals[time] = (totals[time] || 0) + Number(sale.pieces || 0);
  });

  return getBestEntry(totals);
}

function findBestLocation(sales, settings) {
  const totals = {};

  sales.forEach((sale) => {
    const location = sale.location || "Unknown";
    const profit = calculateSaleProfit(sale, settings).totalProfit;

    if (!totals[location]) {
      totals[location] = {
        pieces: 0,
        profit: 0
      };
    }

    totals[location].pieces += Number(sale.pieces || 0);
    totals[location].profit += profit;
  });

  const best = Object.entries(totals).sort((first, second) => {
    return second[1].pieces - first[1].pieces;
  })[0];

  if (!best) return null;

  return {
    name: best[0],
    pieces: best[1].pieces,
    profit: best[1].profit
  };
}

function renderLocationRanking(sales, settings, container) {
  const totals = {};

  sales.forEach((sale) => {
    const location = sale.location || "Unknown";
    const profit = calculateSaleProfit(sale, settings).totalProfit;

    if (!totals[location]) {
      totals[location] = {
        pieces: 0,
        profit: 0
      };
    }

    totals[location].pieces += Number(sale.pieces || 0);
    totals[location].profit += profit;
  });

  const rankings = Object.entries(totals).sort((first, second) => {
    return second[1].pieces - first[1].pieces;
  });

  container.innerHTML = rankings
    .map(([location, data], index) => {
      const label = index === 0
        ? "Best place"
        : data.pieces <= 2
          ? "Try less often"
          : "Good option";

      return `
        <div class="list-item">
          <div>
            <strong>${index + 1}. ${escapeHtml(location)}</strong>
            <small>${label} · ${data.pieces} pieces</small>
          </div>
          <strong>${formatCurrency(data.profit)}</strong>
        </div>
      `;
    })
    .join("");
}

function getBestEntry(totals) {
  const entry = Object.entries(totals).sort((first, second) => {
    return second[1] - first[1];
  })[0];

  if (!entry) return null;

  return {
    name: entry[0],
    pieces: entry[1]
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}