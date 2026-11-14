// reports.js
// This file creates daily, weekly, and all-time reports.

import {
  calculateSaleProfit,
  getSalesForDate,
  getSalesForWeek,
  getTotalProfitForSales,
  sumPieces
} from "./calculations.js";

import {
  formatCurrency,
  getExpenses,
  getSales,
  getSettings,
  getStartOfWeek,
  getTodayDateString
} from "./storage.js";

let currentReport = "daily";

export function setupReports() {
  const reportButtons = document.querySelectorAll(".report-tab");
  const exportButton = document.querySelector("#export-csv");

  reportButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentReport = button.dataset.report || "daily";

      reportButtons.forEach((item) => {
        item.classList.toggle("active-report-tab", item === button);
      });

      renderReport();
    });
  });

  if (exportButton) {
    exportButton.addEventListener("click", exportToCsv);
  }

  renderReport();
}

export function renderReport() {
  const summary = document.querySelector("#report-summary");
  const chart = document.querySelector("#report-chart");

  if (!summary || !chart) return;

  const sales = getSales();
  const expenses = getExpenses();
  const settings = getSettings();

  let reportSales = sales;
  let reportExpenses = expenses;
  let title = "All-time report";

  if (currentReport === "daily") {
    const today = getTodayDateString();
    reportSales = getSalesForDate(sales, today);
    reportExpenses = expenses.filter((expense) => expense.date === today);
    title = "Today's report";
  }

  if (currentReport === "weekly") {
    const weekStart = getStartOfWeek(new Date()).toISOString().split("T")[0];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const endDate = weekEnd.toISOString().split("T")[0];

    reportSales = getSalesForWeek(sales, weekStart);
    reportExpenses = expenses.filter((expense) => {
      return expense.date >= weekStart && expense.date <= endDate;
    });
    title = "This week's report";
  }

  const revenue = reportSales.reduce((total, sale) => {
    return total + calculateSaleProfit(sale, settings).totalRevenue;
  }, 0);

  const profit = getTotalProfitForSales(reportSales, settings);
  const expenseTotal = reportExpenses.reduce((total, expense) => {
    return total + Number(expense.amount || 0);
  }, 0);

  const pieces = sumPieces(reportSales);

  summary.innerHTML = `
    <h2>${title}</h2>
    <div class="money-rule-grid">
      <div>
        <span>Revenue</span>
        <strong>${formatCurrency(revenue)}</strong>
      </div>
      <div>
        <span>Profit</span>
        <strong class="profit-text">${formatCurrency(profit)}</strong>
      </div>
      <div>
        <span>Pieces</span>
        <strong>${pieces}</strong>
      </div>
    </div>
    <p class="muted-text">Recorded expenses: ${formatCurrency(expenseTotal)}</p>
  `;

  renderChart(reportSales, settings, chart);
}

function renderChart(sales, settings, chart) {
  const dailyTotals = getDailyTotals(sales, settings);
  const values = Object.values(dailyTotals);
  const maximum = Math.max(...values, 1);

  if (values.length === 0) {
    chart.innerHTML = '<p class="empty-state">No sales recorded for this report.</p>';
    return;
  }

  chart.innerHTML = Object.entries(dailyTotals)
    .slice(-7)
    .map(([date, value]) => {
      const height = Math.max(12, (value / maximum) * 130);

      return `
        <div
          class="chart-bar"
          style="height: ${height}px"
          title="${date}: ${formatCurrency(value)}"
        >
          <span class="chart-bar-label">${date.slice(5)}</span>
        </div>
      `;
    })
    .join("");
}

function getDailyTotals(sales, settings) {
  return sales.reduce((totals, sale) => {
    const date = new Date(sale.createdAt).toISOString().split("T")[0];
    const profit = calculateSaleProfit(sale, settings).totalProfit;
    totals[date] = (totals[date] || 0) + profit;
    return totals;
  }, {});
}

function exportToCsv() {
  const sales = getSales();
  const expenses = getExpenses();

  const rows = [
    ["Type", "Date", "Amount", "Pieces", "Category", "Location", "Time", "Payment"],
    ...sales.map((sale) => [
      "Sale",
      new Date(sale.createdAt).toISOString(),
      sale.amount ?? "",
      sale.pieces ?? "",
      "",
      sale.location ?? "",
      sale.timeOfDay ?? "",
      sale.payment ?? ""
    ]),
    ...expenses.map((expense) => [
      "Expense",
      expense.date ?? "",
      expense.amount ?? "",
      "",
      expense.category ?? "",
      "",
      "",
      ""
    ])
  ];

  const csv = rows
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "welchs-gummies-report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}