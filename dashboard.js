// dashboard.js
// This file updates the numbers and progress shown on the Home screen.

import {
  calculateSaleProfit,
  getSalesForDate,
  getSalesForWeek,
  getTotalProfitForSales,
  getWeeklyProgress,
  sumPieces
} from "./calculations.js";

import {
  formatCurrency,
  getStartOfWeek,
  getTodayDateString,
  loadState
} from "./storage.js";

export function updateDashboard() {
  const state = loadState();
  const { sales, expenses, settings } = state;
  const today = getTodayDateString();
  const weekStart = getStartOfWeek(new Date()).toISOString().split("T")[0];

  const todaySales = getSalesForDate(sales, today);
  const weekSales = getSalesForWeek(sales, weekStart);

  const todayRevenue = todaySales.reduce((total, sale) => {
    return total + calculateSaleProfit(sale, settings).totalRevenue;
  }, 0);

  const todayProfit = getTotalProfitForSales(todaySales, settings);
  const weekProfit = getTotalProfitForSales(weekSales, settings);
  const totalProfit = getTotalProfitForSales(sales, settings);

  const totalPiecesSold = sumPieces(sales);
  const totalBoxesPurchased = expenses
    .filter((expense) => expense.category === "Box purchase")
    .reduce((total, expense) => {
      return total + Number(expense.boxes || 1);
    }, 0);

  const stockCount = Math.max(
    0,
    totalBoxesPurchased * Number(settings.piecesPerBox) - totalPiecesSold
  );

  const weeklyPieces = sumPieces(weekSales);
  const weeklyProgress = getWeeklyProgress(weeklyPieces, settings);
  const expenseTotal = expenses
    .filter((expense) => expense.date === today)
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);

  const restockAmount = totalProfit * (Number(settings.restockPercent) / 100);
  const savingsAmount = totalProfit * (Number(settings.savingsPercent) / 100);
  const personalAmount = totalProfit * (Number(settings.personalPercent) / 100);

  setText("today-date", formatDate(new Date()));
  setText("today-sales", formatCurrency(todayRevenue));
  setText("today-profit", formatCurrency(todayProfit));
  setText("week-profit", formatCurrency(weekProfit));
  setText("total-profit", formatCurrency(totalProfit));
  setText("stock-count", String(stockCount));
  setText("weekly-pieces", String(weeklyPieces));
  setText("weekly-target-pieces", String(weeklyProgress.targetPieces));
  setText(
    "weekly-target-boxes",
    `${weeklyProgress.boxesReached.toFixed(1)} / ${settings.weeklyTargetBoxes} boxes`
  );
  setText(
    "weekly-progress-text",
    `${weeklyProgress.progress.toFixed(0)}% of this week's target`
  );
  setText("restock-amount", formatCurrency(restockAmount));
  setText("savings-amount", formatCurrency(savingsAmount));
  setText("personal-amount", formatCurrency(personalAmount));
  setText("daily-streak", `${calculateDailyStreak(sales, settings)} days`);

  const progressBar = document.querySelector("#weekly-progress");
  if (progressBar) {
    progressBar.style.width = `${weeklyProgress.progress}%`;
  }

  updateStatus(weeklyProgress.progress);
  updateEveningBanner(todaySales);
  updateStockWarning(stockCount, settings);
  updateExpenseWarning(expenseTotal, settings);
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function updateStatus(progress) {
  const badge = document.querySelector("#status-badge");
  if (!badge) return;

  const onTrack = progress >= 50;
  badge.textContent = onTrack ? "On track" : "Behind";
  badge.classList.toggle("status-on-track", onTrack);
  badge.classList.toggle("status-behind", !onTrack);
}

function updateEveningBanner(todaySales) {
  const banner = document.querySelector("#evening-banner");
  if (!banner) return;

  const hour = new Date().getHours();
  const hasSales = todaySales.length > 0;

  if (hour >= 18 && !hasSales) {
    banner.textContent = "Log today's sales before bed.";
  } else if (hasSales) {
    banner.textContent = "Good work. Keep your sales record up to date.";
  } else {
    banner.textContent = "Start logging today's sales.";
  }
}

function updateStockWarning(stockCount, settings) {
  const stockElement = document.querySelector("#stock-count");
  if (!stockElement) return;

  stockElement.classList.toggle("warning-text", stockCount < 20);

  if (stockCount < 20 && stockCount > 0) {
    stockElement.title = "Stock is low. Fewer than 20 pieces remain.";
  } else if (stockCount === 0) {
    stockElement.title = "No pieces remain in stock.";
  } else {
    stockElement.title = `Stock is above the ${settings.piecesPerBox} piece box size.`;
  }
}

function updateExpenseWarning(expenseTotal, settings) {
  const expenseElement = document.querySelector("#total-profit");
  if (!expenseElement) return;

  if (expenseTotal > Number(settings.expenseLimit)) {
    expenseElement.title = "Today's expenses are above your warning limit.";
  } else {
    expenseElement.title = "";
  }
}

function calculateDailyStreak(sales, settings) {
  const target = Number(settings.dailyTargetPieces);
  let streak = 0;
  const currentDate = new Date();

  for (let daysBack = 0; daysBack < 365; daysBack += 1) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - daysBack);
    const dateString = date.toISOString().split("T")[0];

    const piecesOnDay = sumPieces(getSalesForDate(sales, dateString));

    if (piecesOnDay >= target) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}