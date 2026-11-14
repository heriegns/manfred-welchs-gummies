const TIMER_KEY = "manfred-welchs-timer-v1";

let timerInterval;

export function setupTimer() {
  addTimerScreen();
  renderTimer();
  startTimerUpdates();
}

function addTimerScreen() {
  if (document.querySelector("#timer-screen")) return;

  const screen = document.createElement("section");
  screen.id = "timer-screen";
  screen.className = "screen";

  screen.innerHTML = `
    <div class="screen-heading">
      <p class="eyebrow">Stay focused</p>
      <h2>Timer</h2>
      <p class="muted-text">Choose how long you want to sell, study or rest.</p>
    </div>

    <article class="panel timer-card">
      <div id="timer-display" class="timer-display">00:00:00</div>
      <p id="timer-status" class="muted-text">No timer is running.</p>

      <form id="timer-form" class="form-card">
        <label for="timer-minutes">Countdown minutes</label>
        <input id="timer-minutes" type="number" min="1" max="1440" placeholder="For example, 30" required>
        <button class="primary-button" type="submit">Start timer</button>
      </form>

      <div class="timer-actions">
        <button id="timer-pause" class="secondary-button" type="button">Pause</button>
        <button id="timer-reset" class="secondary-button" type="button">Reset</button>
      </div>
    </article>
  `;

  document.querySelector("main").appendChild(screen);

  document.querySelector("#timer-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const minutes = Number(document.querySelector("#timer-minutes").value);

    if (!Number.isFinite(minutes) || minutes < 1) return;

    const timer = {
      endAt: Date.now() + minutes * 60 * 1000,
      remainingMs: minutes * 60 * 1000,
      paused: false
    };

    saveTimer(timer);
    renderTimer();
  });

  document.querySelector("#timer-pause").addEventListener("click", togglePause);
  document.querySelector("#timer-reset").addEventListener("click", resetTimer);
}

function startTimerUpdates() {
  clearInterval(timerInterval);
  timerInterval = window.setInterval(renderTimer, 1000);
}

function renderTimer() {
  const display = document.querySelector("#timer-display");
  const status = document.querySelector("#timer-status");
  const pauseButton = document.querySelector("#timer-pause");

  if (!display || !status || !pauseButton) return;

  const timer = getTimer();

  if (!timer) {
    display.textContent = "00:00:00";
    status.textContent = "No timer is running.";
    pauseButton.textContent = "Pause";
    return;
  }

  let remainingMs = timer.paused
    ? timer.remainingMs
    : Math.max(0, timer.endAt - Date.now());

  if (remainingMs <= 0) {
    display.textContent = "00:00:00";
    status.textContent = "Time is up!";
    pauseButton.textContent = "Pause";
    playAlert();
    clearTimer();
    return;
  }

  display.textContent = formatDuration(remainingMs);
  status.textContent = timer.paused ? "Timer paused." : "Timer running.";
  pauseButton.textContent = timer.paused ? "Resume" : "Pause";
}

function togglePause() {
  const timer = getTimer();
  if (!timer) return;

  if (timer.paused) {
    timer.endAt = Date.now() + timer.remainingMs;
    timer.paused = false;
  } else {
    timer.remainingMs = Math.max(0, timer.endAt - Date.now());
    timer.paused = true;
  }

  saveTimer(timer);
  renderTimer();
}

function resetTimer() {
  clearTimer();
  renderTimer();
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function playAlert() {
  window.alert("Timer finished. Well done!");

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = 880;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();

    window.setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 800);
  } catch (error) {
    console.warn("Sound alert could not play:", error);
  }
}

function getTimer() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Could not load timer:", error);
    return null;
  }
}

function saveTimer(timer) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
}

function clearTimer() {
  localStorage.removeItem(TIMER_KEY);
}