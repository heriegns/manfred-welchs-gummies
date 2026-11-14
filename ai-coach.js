import { getSales, getExpenses, loadState, saveSettings } from "./storage.js";

const GEMINI_MODEL = "gemini-3.8-flash";

export function setupAiCoach() {
  loadCoachDesign();
  addApiKeySetting();
  addAiCoachPanel();

  document.querySelector("#ai-coach-form")?.addEventListener("submit", askAiCoach);

  document.querySelectorAll(".ai-question-suggestions button").forEach((button) => {
    button.addEventListener("click", () => {
      const questionInput = document.querySelector("#ai-question");
      questionInput.value = button.dataset.question;
      questionInput.focus();
    });
  });
}

function loadCoachDesign() {
  if (document.querySelector('link[data-coach-style="true"]')) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./coach.css";
  link.dataset.coachStyle = "true";
  document.head.appendChild(link);
}

function addApiKeySetting() {
  const settingsForm = document.querySelector("#settings-form");
  if (!settingsForm || document.querySelector("#ai-api-key")) return;

  const heading = document.createElement("h3");
  heading.textContent = "Optional AI Coach";

  const label = document.createElement("label");
  label.htmlFor = "ai-api-key";
  label.textContent = "Gemini API key";

  const input = document.createElement("input");
  input.id = "ai-api-key";
  input.type = "password";
  input.placeholder = "Paste your key on this phone only";
  input.autocomplete = "off";
  input.value = loadState().settings.aiApiKey || "";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "secondary-button";
  saveButton.textContent = "Save AI key";

  const message = document.createElement("p");
  message.className = "form-message";

  saveButton.addEventListener("click", () => {
    const key = input.value.trim();

    if (!key) {
      message.textContent = "Enter an API key first.";
      message.className = "form-message error";
      return;
    }

    saveSettings({ aiApiKey: key });
    message.textContent = "AI key saved on this device.";
    message.className = "form-message success";
  });

  settingsForm.append(heading, label, input, saveButton, message);
}

function addAiCoachPanel() {
  const coachScreen = document.querySelector("#coach-screen");
  if (!coachScreen || document.querySelector("#ai-coach-panel")) return;

  const panel = document.createElement("article");
  panel.id = "ai-coach-panel";
  panel.className = "panel";

  panel.innerHTML = `
    <span class="ai-coach-badge">✦ Smart business coach</span>
    <h2>Ask your Coach</h2>
    <p class="muted-text">
      Get practical ideas based on your sales, expenses, KNUST and current research.
    </p>

    <div class="ai-question-suggestions">
      <button type="button" data-question="What should I sell more of this week?">Sell more</button>
      <button type="button" data-question="Which KNUST locations and times should I focus on?">Best locations</button>
      <button type="button" data-question="Should I run a deal this week?">Run a deal</button>
    </div>

    <form id="ai-coach-form" class="form-card">
      <label for="ai-question">Your question</label>
      <textarea
        id="ai-question"
        rows="4"
        maxlength="500"
        placeholder="For example: How can I reach my weekly target?"
        required
      ></textarea>
      <button class="primary-button" type="submit">Ask AI Coach</button>
      <p id="ai-coach-message" class="form-message"></p>
    </form>

    <div id="ai-coach-answer" class="list-container">
      <p class="empty-state">Your answer will appear here.</p>
    </div>
  `;

  coachScreen.appendChild(panel);
}

async function askAiCoach(event) {
  event.preventDefault();

  const state = loadState();
  const apiKey = state.settings.aiApiKey;
  const question = document.querySelector("#ai-question").value.trim();
  const message = document.querySelector("#ai-coach-message");
  const answerBox = document.querySelector("#ai-coach-answer");

  if (!apiKey) {
    showMessage(message, "Save your Gemini API key in Settings first.", true);
    return;
  }

  showMessage(message, "Your Coach is thinking...", false);
  answerBox.innerHTML = "";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildPrompt(question, state)
                }
              ]
            }
          ]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "The AI request failed.");
    }

    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      throw new Error("The AI returned an empty answer.");
    }

    answerBox.innerHTML = `
      <div class="list-item">
        <span>${escapeHtml(answer)}</span>
      </div>
    `;

    showMessage(message, "Answer received.", false);
  } catch (error) {
    showMessage(message, error.message, true);
  }
}

function buildPrompt(question, state) {
  const sales = getSales().map((sale) => ({
    pieces: sale.pieces,
    pricePerPiece: sale.pricePerPiece,
    location: sale.location,
    timeOfDay: sale.timeOfDay,
    payment: sale.payment,
    date: sale.createdAt
  }));

  const expenses = getExpenses().map((expense) => ({
    amount: expense.amount,
    category: expense.category,
    date: expense.date
  }));

  return `
You are a practical and encouraging business coach for a KNUST student in Ghana selling Welch's gummies.

Use current web research when useful, especially KNUST campus events, activities, student schedules, and relevant Ghana information. Clearly separate confirmed facts from suggestions. Include source links when web research is used.

Give short, specific actions. Consider profit, stock, location, time, affordability, and safety. Do not invent campus facts.

Business settings:
${JSON.stringify(state.settings)}

My sales:
${JSON.stringify(sales)}

My expenses:
${JSON.stringify(expenses)}

Question:
${question}
`;
}

function showMessage(element, text, isError) {
  element.textContent = text;
  element.className = `form-message ${isError ? "error" : "success"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}