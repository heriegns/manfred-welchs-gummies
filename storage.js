const STORAGE_KEY = "manfred-welchs-gummies-app-v1";

export const defaultSettings = {
  boxCost: 310,
  piecesPerBox: 90,
  pricePerPiece: 5,
  weeklyTargetBoxes: 7,
  dailyTargetPieces: 90,
  expenseLimit: 500,
  restockPercent: 50,
  savingsPercent: 20,
  personalPercent: 30,
  locations: [
    "Hostels",
    "Lecture halls",
    "Canteen",
    "Fellowship events",
    "Library area"
  ]
};

export const defaultState = {
  theme: "light",
  sales: [],
  expenses: [],
  customers: [],
  settings: { ...defaultSettings }
};

function deepMerge(base, incoming) {
  const output = { ...base };

  for (const key in incoming) {
    if (
      incoming[key] &&
      typeof incoming[key] === "object" &&
      !Array.isArray(incoming[key])
    ) {
      output[key] = deepMerge(output[key] || {}, incoming[key]);
    } else {
      output[key] = incoming[key];
    }
  }

  return output;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return structuredClone(defaultState);
    }

    return deepMerge(defaultState, JSON.parse(raw));
  } catch (error) {
    console.error("Could not load saved data:", error);
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getSettings() {
  return loadState().settings;
}

export function saveSettings(nextSettings) {
  const state = loadState();
  state.settings = { ...state.settings, ...nextSettings };
  saveState(state);
  return state;
}

export function addSale(sale) {
  const state = loadState();

  state.sales.push({
    ...sale,
    id: createId(),
    createdAt: new Date().toISOString()
  });

  saveState(state);
  return state;
}

export function updateSale(saleId, changes) {
  const state = loadState();
  const saleIndex = state.sales.findIndex((sale) => sale.id === saleId);

  if (saleIndex === -1) {
    throw new Error("Sale could not be found.");
  }

  state.sales[saleIndex] = {
    ...state.sales[saleIndex],
    ...changes,
    updatedAt: new Date().toISOString()
  };

  saveState(state);
  return state;
}

export function deleteSale(saleId) {
  const state = loadState();
  const originalLength = state.sales.length;

  state.sales = state.sales.filter((sale) => sale.id !== saleId);

  if (state.sales.length === originalLength) {
    throw new Error("Sale could not be found.");
  }

  saveState(state);
  return state;
}

export function addExpense(expense) {
  const state = loadState();

  state.expenses.push({
    ...expense,
    id: createId(),
    createdAt: new Date().toISOString()
  });

  saveState(state);
  return state;
}

export function updateExpense(expenseId, changes) {
  const state = loadState();
  const expenseIndex = state.expenses.findIndex(
    (expense) => expense.id === expenseId
  );

  if (expenseIndex === -1) {
    throw new Error("Expense could not be found.");
  }

  state.expenses[expenseIndex] = {
    ...state.expenses[expenseIndex],
    ...changes,
    updatedAt: new Date().toISOString()
  };

  saveState(state);
  return state;
}

export function deleteExpense(expenseId) {
  const state = loadState();
  const originalLength = state.expenses.length;

  state.expenses = state.expenses.filter(
    (expense) => expense.id !== expenseId
  );

  if (state.expenses.length === originalLength) {
    throw new Error("Expense could not be found.");
  }

  saveState(state);
  return state;
}

export function addCustomer(customer) {
  const state = loadState();

  state.customers.push({
    ...customer,
    id: createId(),
    createdAt: new Date().toISOString()
  });

  saveState(state);
  return state;
}

export function updateCustomer(customerId, changes) {
  const state = loadState();
  const customerIndex = state.customers.findIndex(
    (customer) => customer.id === customerId
  );

  if (customerIndex === -1) {
    throw new Error("Customer could not be found.");
  }

  state.customers[customerIndex] = {
    ...state.customers[customerIndex],
    ...changes,
    updatedAt: new Date().toISOString()
  };

  saveState(state);
  return state;
}

export function deleteCustomer(customerId) {
  const state = loadState();
  const originalLength = state.customers.length;

  state.customers = state.customers.filter(
    (customer) => customer.id !== customerId
  );

  if (state.customers.length === originalLength) {
    throw new Error("Customer could not be found.");
  }

  saveState(state);
  return state;
}

export function getCustomers() {
  return loadState().customers;
}

export function updateTheme(themeName) {
  const state = loadState();
  state.theme = themeName;
  saveState(state);
  return state;
}

export function getSales() {
  return loadState().sales;
}

export function getExpenses() {
  return loadState().expenses;
}

export function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);

  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

export function getWeekKey(date) {
  return getStartOfWeek(date).toISOString().split("T")[0];
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2
  }).format(value);
}

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}