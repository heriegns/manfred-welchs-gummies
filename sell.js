import {
  addSale,
  deleteSale,
  formatCurrency,
  getSales,
  loadState,
  updateSale
} from "./storage.js";

import { updateDashboard } from "./dashboard.js";

export function setupSellForm() {
  const form = document.querySelector("#sale-form");
  const locationSelect = document.querySelector("#sale-location");
  const priceInput = document.querySelector("#sale-price");

  if (!form) return;

  loadLocations(locationSelect);

  const savedSettings = loadState().settings;

  if (priceInput) {
    priceInput.value = savedSettings.pricePerPiece;
  }

  addSalesList();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const pieces = Number(formData.get("pieces"));
    const pricePerPiece = Number(formData.get("price"));
    const location = String(formData.get("location") || "").trim();
    const timeOfDay = String(formData.get("timeOfDay") || "").trim();
    const payment = String(formData.get("payment") || "").trim();

    if (!pieces || pieces < 1) {
      showMessage("Enter at least 1 piece.", true);
      return;
    }

    if (!Number.isFinite(pricePerPiece) || pricePerPiece < 0) {
      showMessage("Enter a valid price.", true);
      return;
    }

    if (!location || !timeOfDay || !payment) {
      showMessage("Complete all sale details.", true);
      return;
    }

    addSale({
      pieces,
      pricePerPiece,
      location,
      timeOfDay,
      payment,
      amount: pieces * pricePerPiece
    });

    form.reset();
    priceInput.value = loadState().settings.pricePerPiece;
    showMessage("Sale saved successfully.", false);
    renderSales();
    updateDashboard();
  });

  renderSales();
}

function addSalesList() {
  if (document.querySelector("#sales-history-panel")) return;

  const sellScreen = document.querySelector("#sell-screen");
  const form = document.querySelector("#sale-form");

  if (!sellScreen || !form) return;

  const panel = document.createElement("article");
  panel.id = "sales-history-panel";
  panel.className = "panel";
  panel.innerHTML = `
    <div class="panel-heading">
      <h2>Recent sales</h2>
      <span class="muted-text">Edit mistakes anytime</span>
    </div>
    <div id="sales-list" class="list-container"></div>
  `;

  form.insertAdjacentElement("afterend", panel);
}

function renderSales() {
  const list = document.querySelector("#sales-list");
  if (!list) return;

  const sales = [...getSales()]
    .sort((first, second) => {
      return new Date(second.createdAt) - new Date(first.createdAt);
    })
    .slice(0, 20);

  if (sales.length === 0) {
    list.innerHTML = '<p class="empty-state">No sales recorded yet.</p>';
    return;
  }

  list.innerHTML = sales
    .map((sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString("en-GH");

      return `
        <div class="list-item record-item">
          <div>
            <strong>${sale.pieces} pieces · ${escapeHtml(sale.location)}</strong>
            <small>${date} · ${escapeHtml(sale.timeOfDay)} · ${escapeHtml(sale.payment)}</small>
          </div>
          <div class="record-actions">
            <strong>${formatCurrency(Number(sale.amount || 0))}</strong>
            <button class="record-action edit-action" data-sale-edit="${sale.id}" type="button">Edit</button>
            <button class="record-action delete-action" data-sale-delete="${sale.id}" type="button">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll("[data-sale-edit]").forEach((button) => {
    button.addEventListener("click", () => editSale(button.dataset.saleEdit));
  });

  list.querySelectorAll("[data-sale-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteSaleRecord(button.dataset.saleDelete));
  });
}

function editSale(saleId) {
  const sale = getSales().find((item) => item.id === saleId);
  if (!sale) return;

  const pieces = Number(prompt("Enter the corrected number of pieces:", sale.pieces));
  if (!Number.isFinite(pieces) || pieces < 1) return;

  const pricePerPiece = Number(
    prompt("Enter the corrected price per piece:", sale.pricePerPiece)
  );
  if (!Number.isFinite(pricePerPiece) || pricePerPiece < 0) return;

  try {
    updateSale(saleId, {
      pieces,
      pricePerPiece,
      amount: pieces * pricePerPiece
    });

    renderSales();
    updateDashboard();
    showMessage("Sale updated.", false);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function deleteSaleRecord(saleId) {
  const confirmed = window.confirm("Delete this sale permanently?");

  if (!confirmed) return;

  try {
    deleteSale(saleId);
    renderSales();
    updateDashboard();
    showMessage("Sale deleted.", false);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function loadLocations(selectElement) {
  if (!selectElement) return;

  const settings = loadState().settings;
  const currentValue = selectElement.value;

  selectElement.innerHTML = '<option value="">Choose a location</option>';

  settings.locations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    selectElement.appendChild(option);
  });

  selectElement.value = currentValue;
}

function showMessage(message, isError) {
  const messageElement = document.querySelector("#sale-message");
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