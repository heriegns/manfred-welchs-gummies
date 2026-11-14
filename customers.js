import {
  addCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer
} from "./storage.js";

export function setupCustomers() {
  addCustomersNavigation();
  addCustomersScreen();

  document.querySelector("#customer-form")?.addEventListener("submit", saveCustomer);
  renderCustomers();
}

function addCustomersNavigation() {
  const navigation = document.querySelector(".bottom-nav");
  const settingsButton = navigation?.querySelector('[data-screen="settings-screen"]');

  if (
    !navigation ||
    !settingsButton ||
    navigation.querySelector('[data-screen="customers-screen"]')
  ) {
    return;
  }

  const customersButton = document.createElement("button");
  customersButton.className = "nav-button";
  customersButton.type = "button";
  customersButton.dataset.screen = "customers-screen";
  customersButton.innerHTML = "<span>♙</span><small>Customers</small>";

  navigation.insertBefore(customersButton, settingsButton);
  navigation.style.gridTemplateColumns = "repeat(7, minmax(0, 1fr))";
}

function addCustomersScreen() {
  if (document.querySelector("#customers-screen")) return;

  const screen = document.createElement("section");
  screen.id = "customers-screen";
  screen.className = "screen";

  screen.innerHTML = `
    <div class="screen-heading">
      <p class="eyebrow">People you serve</p>
      <h2>Customers</h2>
      <p class="muted-text">Save useful customer details. Contact is optional.</p>
    </div>

    <form id="customer-form" class="form-card">
      <label for="customer-name">Customer name</label>
      <input id="customer-name" name="name" type="text" maxlength="80" placeholder="For example, Ama" required>

      <label for="customer-contact">Contact number (optional)</label>
      <input id="customer-contact" name="contact" type="tel" maxlength="30" placeholder="For example, 024 000 0000">

      <label for="customer-room">Room number (optional)</label>
      <input id="customer-room" name="room" type="text" maxlength="30" placeholder="For example, B12">

      <label for="customer-hostel-hall">Hostel or hall</label>
      <input id="customer-hostel-hall" name="hostelHall" type="text" maxlength="80" placeholder="For example, Unity Hall" required>

      <label for="customer-notes">Notes (optional)</label>
      <textarea id="customer-notes" name="notes" rows="3" maxlength="200" placeholder="Favorite flavor or reminder"></textarea>

      <button class="primary-button" type="submit">Save customer</button>
      <p id="customer-message" class="form-message"></p>
    </form>

    <article class="panel">
      <div class="panel-heading">
        <h2>Saved customers</h2>
        <span id="customer-count" class="muted-text">0 people</span>
      </div>
      <div id="customer-list" class="list-container"></div>
    </article>
  `;

  document.querySelector("main").appendChild(screen);
}

function saveCustomer(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const room = String(formData.get("room") || "").trim();
  const hostelHall = String(formData.get("hostelHall") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !hostelHall) {
    showMessage("Enter the customer name and hostel or hall.", true);
    return;
  }

  addCustomer({
    name,
    contact,
    room,
    hostelHall,
    notes
  });

  form.reset();
  showMessage("Customer saved.", false);
  renderCustomers();
}

function renderCustomers() {
  const list = document.querySelector("#customer-list");
  const count = document.querySelector("#customer-count");

  if (!list || !count) return;

  const customers = [...getCustomers()].sort((first, second) => {
    return new Date(second.createdAt) - new Date(first.createdAt);
  });

  count.textContent = `${customers.length} ${customers.length === 1 ? "person" : "people"}`;

  if (customers.length === 0) {
    list.innerHTML = '<p class="empty-state">No customers saved yet.</p>';
    return;
  }

  list.innerHTML = customers
    .map((customer) => {
      const contact = customer.contact
        ? `<small>Contact: ${escapeHtml(customer.contact)}</small>`
        : "";

      const room = customer.room
        ? ` · Room ${escapeHtml(customer.room)}`
        : "";

      const notes = customer.notes
        ? `<small>${escapeHtml(customer.notes)}</small>`
        : "";

      return `
        <div class="list-item record-item">
          <div>
            <strong>${escapeHtml(customer.name)}</strong>
            <small>${escapeHtml(customer.hostelHall)}${room}</small>
            ${contact}
            ${notes}
          </div>
          <div class="record-actions">
            <button class="record-action edit-action" data-customer-edit="${customer.id}" type="button">Edit</button>
            <button class="record-action delete-action" data-customer-delete="${customer.id}" type="button">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll("[data-customer-edit]").forEach((button) => {
    button.addEventListener("click", () => editCustomer(button.dataset.customerEdit));
  });

  list.querySelectorAll("[data-customer-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteCustomerRecord(button.dataset.customerDelete));
  });
}

function editCustomer(customerId) {
  const customer = getCustomers().find((item) => item.id === customerId);
  if (!customer) return;

  const name = prompt("Customer name:", customer.name);
  if (!name) return;

  const hostelHall = prompt("Hostel or hall:", customer.hostelHall);
  if (!hostelHall) return;

  const contact = prompt("Contact number, or leave blank:", customer.contact || "");
  if (contact === null) return;

  const room = prompt("Room number, or leave blank:", customer.room || "");
  if (room === null) return;

  try {
    updateCustomer(customerId, {
      name: name.trim(),
      hostelHall: hostelHall.trim(),
      contact: contact.trim(),
      room: room.trim()
    });

    renderCustomers();
    showMessage("Customer updated.", false);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function deleteCustomerRecord(customerId) {
  if (!window.confirm("Delete this customer permanently?")) return;

  try {
    deleteCustomer(customerId);
    renderCustomers();
    showMessage("Customer deleted.", false);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function showMessage(message, isError) {
  const element = document.querySelector("#customer-message");
  if (!element) return;

  element.textContent = message;
  element.className = `form-message ${isError ? "error" : "success"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}