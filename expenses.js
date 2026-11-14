import {
  addExpense,
  deleteExpense,
  formatCurrency,
  getExpenses,
  loadState,
  updateExpense
} from "./storage.js";

import { updateDashboard } from "./dashboard.js";

export function setupExpenseForm() {
  const form = document.querySelector("#expense-form");
  const dateInput = document.querySelector("#expense-date");

  if (!form) return;

  if (dateInput && !dateInput.value) {
    dateInput.value = getTodayDate();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const amount = Number(formData.get("amount"));
    const category = String(formData.get("category") || "").trim();
    const note = String(formData.get("note") || "").trim();
    const date = String(formData.get("date") || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Enter a valid expense amount.", true);
      return;
    }

    if (!category || !date) {
      showMessage("Complete the expense details.", true);
      return;
    }

    addExpense({
      amount,
      category,
      note,
      date,
      boxes: category === "Box purchase" ? 1 : 0
    });

    form.reset();
    dateInput.value = getTodayDate();
    showMessage("Expense saved successfully.", false);
    renderExpenses();
    updateDashboard();
  });

  renderExpenses();
}

export function renderExpenses() {
  const list = document.querySelector("#expense-list");
  const totalElement = document.querySelector("#total-expenses");

  if (!list || !totalElement) return;

  const expenses = [...getExpenses()].sort((first, second) => {
    return new Date(`${second.date}T00:00:00`) -
      new Date(`${first.date}T00:00:00`);
  });

  const total = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  totalElement.textContent = formatCurrency(total);

  if (expenses.length === 0) {
    list.innerHTML = '<p class="empty-state">No expenses recorded yet.</p>';
    return;
  }

  list.innerHTML = expenses
    .slice(0, 20)
    .map((expense) => {
      const note = expense.note ? ` · ${escapeHtml(expense.note)}` : "";

      return `
        <div class="list-item record-item">
          <div>
            <strong>${escapeHtml(expense.category)}</strong>
            <small>${escapeHtml(expense.date)}${note}</small>
          </div>
          <div class="record-actions">
            <strong>${formatCurrency(Number(expense.amount || 0))}</strong>
            <button class="record-action edit-action" data-expense-edit="${expense.id}" type="button">Edit</button>
            <button class="record-action delete-action" data-expense-delete="${expense.id}" type="button">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll("[data-expense-edit]").forEach((button) => {
    button.addEventListener("click", () => editExpense(button.dataset.expenseEdit));
  });

  list.querySelectorAll("[data-expense-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteExpenseRecord(button.dataset.expenseDelete));
  });
}

function editExpense(expenseId) {
  const expense = getExpenses().find((item) => item.id === expenseId);
  if (!expense) return;

  const amount = Number(prompt("Enter the corrected amount:", expense.amount));
  if (!Number.isFinite(amount) || amount <= 0) return;

  const note = prompt("Enter the corrected note:", expense.note || "");
  if (note === null) return;

  try {
    updateExpense(expenseId, { amount, note });
    renderExpenses();
    updateDashboard();
    showMessage("Expense updated.", false);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function deleteExpenseRecord(expenseId) {
  const confirmed = window.confirm("Delete this expense permanently?");

  if (!confirmed) return;

  try {
    deleteExpense(expenseId);
    renderExpenses();
    updateDashboard();
    showMessage("Expense deleted.", false);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function showMessage(message, isError) {
  const messageElement = document.querySelector("#expense-message");
  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
  messageElement.classList.toggle("success", !isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}