// settings.js
// This file saves prices, targets, limits, and profit split settings.

import { loadState, saveSettings } from "./storage.js";
import { updateDashboard } from "./dashboard.js";
import { renderCoach } from "./coach.js";
import { renderReport } from "./reports.js";

export function setupSettings() {
  const form = document.querySelector("#settings-form");
  if (!form) return;

  fillSettingsForm(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const nextSettings = {
      boxCost: Number(formData.get("boxCost")),
      piecesPerBox: Number(formData.get("piecesPerBox")),
      pricePerPiece: Number(formData.get("pricePerPiece")),
      weeklyTargetBoxes: Number(formData.get("weeklyTargetBoxes")),
      dailyTargetPieces: Number(formData.get("dailyTargetPieces")),
      expenseLimit: Number(formData.get("expenseLimit")),
      restockPercent: Number(formData.get("restockPercent")),
      savingsPercent: Number(formData.get("savingsPercent")),
      personalPercent: Number(formData.get("personalPercent"))
    };

    const validationError = validateSettings(nextSettings);

    if (validationError) {
      showMessage(validationError, true);
      return;
    }

    const currentSettings = loadState().settings;

    saveSettings({
      ...currentSettings,
      ...nextSettings
    });

    showMessage("Settings saved successfully.", false);
    updateDashboard();
    renderCoach();
    renderReport();
  });
}

function fillSettingsForm(form) {
  const settings = loadState().settings;

  setValue(form, "boxCost", settings.boxCost);
  setValue(form, "piecesPerBox", settings.piecesPerBox);
  setValue(form, "pricePerPiece", settings.pricePerPiece);
  setValue(form, "weeklyTargetBoxes", settings.weeklyTargetBoxes);
  setValue(form, "dailyTargetPieces", settings.dailyTargetPieces);
  setValue(form, "expenseLimit", settings.expenseLimit);
  setValue(form, "restockPercent", settings.restockPercent);
  setValue(form, "savingsPercent", settings.savingsPercent);
  setValue(form, "personalPercent", settings.personalPercent);
}

function setValue(form, name, value) {
  const input = form.elements[name];
  if (input) {
    input.value = value;
  }
}

function validateSettings(settings) {
  const numberFields = [
    "boxCost",
    "piecesPerBox",
    "pricePerPiece",
    "weeklyTargetBoxes",
    "dailyTargetPieces",
    "expenseLimit",
    "restockPercent",
    "savingsPercent",
    "personalPercent"
  ];

  for (const field of numberFields) {
    if (!Number.isFinite(settings[field])) {
      return "Enter valid numbers in every field.";
    }
  }

  if (settings.boxCost < 0 || settings.piecesPerBox <= 0 || settings.pricePerPiece < 0) {
    return "Prices must be zero or higher, and pieces per box must be above zero.";
  }

  if (settings.weeklyTargetBoxes <= 0 || settings.dailyTargetPieces <= 0) {
    return "Your weekly and daily targets must be above zero.";
  }

  if (settings.expenseLimit < 0) {
    return "The expense limit cannot be negative.";
  }

  const percentageTotal =
    settings.restockPercent +
    settings.savingsPercent +
    settings.personalPercent;

  if (
    settings.restockPercent < 0 ||
    settings.savingsPercent < 0 ||
    settings.personalPercent < 0 ||
    percentageTotal !== 100
  ) {
    return "Profit split percentages must add up to exactly 100.";
  }

  return "";
}

function showMessage(message, isError) {
  const messageElement = document.querySelector("#settings-message");
  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
  messageElement.classList.toggle("success", !isError);
}