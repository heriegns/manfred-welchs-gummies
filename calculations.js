// calculations.js
// This file does the math for your business.
// It turns sales, costs, and stock into profit, break-even, and margin numbers.

export function calculateCostPerPiece(settings) {
  return Number(settings.boxCost) / Number(settings.piecesPerBox);
}

export function calculateProfitPerPiece(settings) {
  const costPerPiece = calculateCostPerPiece(settings);
  return Number(settings.pricePerPiece) - costPerPiece;
}

export function calculateMarginPercent(pricePerPiece, costPerPiece) {
  if (!pricePerPiece || pricePerPiece <= 0) return 0;
  const profitPerPiece = pricePerPiece - costPerPiece;
  return (profitPerPiece / pricePerPiece) * 100;
}

export function calculateBreakEvenPieces(settings) {
  const price = Number(settings.pricePerPiece);
  const boxCost = Number(settings.boxCost);
  if (!price || price <= 0) return 0;
  return boxCost / price;
}

export function calculateSaleProfit(sale, settings) {
  const costPerPiece = calculateCostPerPiece(settings);
  const salePrice = Number(sale.pricePerPiece ?? sale.price ?? settings.pricePerPiece);
  const pieces = Number(sale.pieces ?? 0);

  const totalRevenue = pieces * salePrice;
  const totalCost = pieces * costPerPiece;
  const totalProfit = totalRevenue - totalCost;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitPerPiece: salePrice - costPerPiece
  };
}

export function getSalesForDate(sales, targetDateString) {
  return sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt).toISOString().split("T")[0];
    return saleDate === targetDateString;
  });
}

export function getSalesForWeek(sales, weekStartDateString) {
  const weekStart = new Date(weekStartDateString);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= weekStart && saleDate < weekEnd;
  });
}

export function sumSales(sales) {
  return sales.reduce((total, sale) => total + Number(sale.amount ?? 0), 0);
}

export function sumPieces(sales) {
  return sales.reduce((total, sale) => total + Number(sale.pieces ?? 0), 0);
}

export function getTotalProfitForSales(sales, settings) {
  const costPerPiece = calculateCostPerPiece(settings);
  return sales.reduce((total, sale) => {
    const pieces = Number(sale.pieces ?? 0);
    const price = Number(sale.pricePerPiece ?? sale.price ?? settings.pricePerPiece);
    const revenue = pieces * price;
    const cost = pieces * costPerPiece;
    return total + (revenue - cost);
  }, 0);
}

export function getStockRemaining(stockCount) {
  return Math.max(0, Number(stockCount || 0));
}

export function getExpectedBoxesFromPieces(pieces, settings) {
  return pieces / Number(settings.piecesPerBox || 1);
}

export function getWeeklyProgress(piecesSoldThisWeek, settings) {
  const targetPieces = Number(settings.weeklyTargetBoxes || 7) * Number(settings.piecesPerBox || 90);
  const progress = targetPieces > 0 ? (piecesSoldThisWeek / targetPieces) * 100 : 0;
  return {
    targetPieces,
    progress: Math.min(progress, 100),
    boxesReached: piecesSoldThisWeek / Number(settings.piecesPerBox || 90)
  };
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.max(0, value).toFixed(1)}%`;
}