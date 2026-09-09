import "./style.css";
import { pipeline } from "@huggingface/transformers";

const MODEL_ID = "onnx-community/emotion-english-distilroberta-base-ONNX";
const ROUNDS = 6;
const PASS_SCORE = 0.45;

const SCENARIOS = [
  {
    prompt: "The vault door hiccups open. A sentry drone asks why you’re here.",
    emotion: "joy",
    hint: "Sound delighted — like this is the best night of your life.",
  },
  {
    prompt: "Your rival boasts they already claimed the crystal core.",
    emotion: "anger",
    hint: "Let the heat show. Sharp, furious, unfiltered.",
  },
  {
    prompt: "The corridor lights die. Something scrapes along the floor.",
    emotion: "fear",
    hint: "Write as if you’re bracing for the worst.",
  },
  {
    prompt: "A teammate laughs at your failed hack attempt.",
    emotion: "sadness",
    hint: "Lean into the sting — soft, wounded, honest.",
  },
  {
    prompt: "You spot a glowing map fragment under loose plating.",
    emotion: "surprise",
    hint: "Catch that jolt of discovery in your words.",
  },
  {
    prompt: "The raid boss offers a shady deal for safe passage.",
    emotion: "disgust",
    hint: "Make your rejection visceral and contemptuous.",
  },
];

const EMOTION_LABELS = {
  joy: "Joy",
  anger: "Anger",
  fear: "Fear",
  sadness: "Sadness",
  surprise: "Surprise",
  disgust: "Disgust",
  love: "Love",
  neutral: "Neutral",
};

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="shell">
    <header class="brand">
      <h1>Vibe <span>Raid</span></h1>
      <p>
        Craft lines that match the target emotion. A Hugging Face model scores
        you in-browser — no backend, no API key.
      </p>
    </header>

    <div class="hud">
      <div class="stat">
        <label>Round</label>
        <strong id="round">—</strong>
      </div>
      <div class="stat">
        <label>Score</label>
        <strong id="score">0</strong>
      </div>
      <div class="stat">
        <label>Model</label>
        <strong style="font-size:0.95rem">emotion-roberta</strong>
      </div>
    </div>

    <section class="stage" id="stage">
      <p class="prompt-kicker" id="kicker">Mission briefing</p>
      <h2 class="prompt" id="prompt">Loading Hugging Face model…</h2>
      <div class="target" id="targetRow">
        <span class="pulse-dot" aria-hidden="true"></span>
        <span>Target vibe: <b id="target">—</b></span>
      </div>
      <div class="meter" aria-hidden="true"><span id="confidence"></span></div>
      <p class="feedback" id="feedback">First download may take a few seconds.</p>
    </section>

    <form class="composer" id="form">
      <textarea
        id="line"
        maxlength="280"
        placeholder="Type your raid line…"
        disabled
      ></textarea>
      <div class="actions">
        <button class="primary" id="fire" type="submit" disabled>Fire line</button>
        <button class="ghost" id="skip" type="button" disabled>Skip round</button>
      </div>
    </form>

    <div class="overlay" id="boot">
      <div>
        <h2>Linking Hub</h2>
        <p class="loading-copy" id="bootCopy">
          Pulling <code>${MODEL_ID}</code> via Transformers.js…
        </p>
      </div>
    </div>

    <div class="overlay hidden" id="end">
      <div>
        <h2 id="endTitle">Raid complete</h2>
        <p id="endCopy"></p>
        <button class="primary" id="replay" type="button">Raid again</button>
      </div>
    </div>
  </div>
`;

const els = {
  round: document.querySelector("#round"),
  score: document.querySelector("#score"),
  kicker: document.querySelector("#kicker"),
  prompt: document.querySelector("#prompt"),
  target: document.querySelector("#target"),
  feedback: document.querySelector("#feedback"),
  confidence: document.querySelector("#confidence"),
  line: document.querySelector("#line"),
  fire: document.querySelector("#fire"),
  skip: document.querySelector("#skip"),
  form: document.querySelector("#form"),
  boot: document.querySelector("#boot"),
  bootCopy: document.querySelector("#bootCopy"),
  end: document.querySelector("#end"),
  endTitle: document.querySelector("#endTitle"),
  endCopy: document.querySelector("#endCopy"),
  replay: document.querySelector("#replay"),
};

const state = {
  classifier: null,
  index: 0,
  score: 0,
  busy: false,
  order: [],
};

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setBusy(busy) {
  state.busy = busy;
  els.fire.disabled = busy || !state.classifier;
  els.skip.disabled = busy || !state.classifier;
  els.line.disabled = busy || !state.classifier;
}

function currentScenario() {
  return state.order[state.index];
}

function renderRound() {
  const scenario = currentScenario();
  if (!scenario) return;

  els.round.textContent = `${state.index + 1} / ${ROUNDS}`;
  els.score.textContent = String(state.score);
  els.kicker.textContent = `Sector ${String.fromCharCode(65 + state.index)}`;
  els.prompt.textContent = scenario.prompt;
  els.target.textContent = EMOTION_LABELS[scenario.emotion] || scenario.emotion;
  els.feedback.className = "feedback";
  els.feedback.textContent = scenario.hint;
  els.confidence.style.width = "0%";
  els.line.value = "";
  els.line.focus();
}

function finishRaid() {
  const max = ROUNDS * 100;
  const pct = Math.round((state.score / max) * 100);
  els.endTitle.textContent = pct >= 70 ? "Core secured" : "Extraction messy";
  els.endCopy.textContent = `You scored ${state.score} / ${max} (${pct}%). Emotion model: ${MODEL_ID}`;
  els.end.classList.remove("hidden");
}

async function loadModel() {
  els.bootCopy.textContent = `Pulling ${MODEL_ID} via Transformers.js…`;
  state.classifier = await pipeline("text-classification", MODEL_ID, {
    dtype: "q8",
  });
  els.boot.classList.add("hidden");
  setBusy(false);
}

async function scoreLine(text) {
  const results = await state.classifier(text, { top_k: null });
  const ranked = Array.isArray(results[0]) ? results[0] : results;
  const byLabel = Object.fromEntries(
    ranked.map((row) => [String(row.label).toLowerCase(), row.score]),
  );
  const scenario = currentScenario();
  const targetScore = byLabel[scenario.emotion] ?? 0;
  const top = ranked[0];
  return { targetScore, top, byLabel };
}

async function resolveRound({ skipped = false } = {}) {
  if (state.busy || !state.classifier) return;

  const scenario = currentScenario();
  const text = els.line.value.trim();

  if (!skipped && text.length < 4) {
    els.feedback.className = "feedback miss";
    els.feedback.textContent = "Need at least a few words to read the vibe.";
    return;
  }

  setBusy(true);

  if (skipped) {
    els.feedback.className = "feedback miss";
    els.feedback.textContent = `Skipped. Target was ${EMOTION_LABELS[scenario.emotion]}.`;
    els.confidence.style.width = "0%";
  } else {
    els.feedback.className = "feedback";
    els.feedback.textContent = "Reading vibe with Hugging Face…";
    try {
      const { targetScore, top } = await scoreLine(text);
      const points = Math.round(targetScore * 100);
      const hit = targetScore >= PASS_SCORE;
      state.score += hit ? points : Math.round(points * 0.25);
      els.score.textContent = String(state.score);
      els.confidence.style.width = `${Math.round(targetScore * 100)}%`;
      els.feedback.className = hit ? "feedback hit" : "feedback miss";
      els.feedback.textContent = hit
        ? `Hit! ${EMOTION_LABELS[scenario.emotion]} @ ${(targetScore * 100).toFixed(1)}% (+${points})`
        : `Off-vibe. Model heard ${EMOTION_LABELS[String(top.label).toLowerCase()] || top.label} (${(top.score * 100).toFixed(1)}%). Target confidence ${(targetScore * 100).toFixed(1)}%.`;
    } catch (err) {
      console.error(err);
      els.feedback.className = "feedback miss";
      els.feedback.textContent = "Model hiccup — try again.";
      setBusy(false);
      return;
    }
  }

  await new Promise((r) => setTimeout(r, 900));
  state.index += 1;
  if (state.index >= ROUNDS) {
    setBusy(false);
    finishRaid();
    return;
  }
  renderRound();
  setBusy(false);
}

function startRaid() {
  state.index = 0;
  state.score = 0;
  state.order = shuffle(SCENARIOS).slice(0, ROUNDS);
  els.end.classList.add("hidden");
  renderRound();
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  resolveRound();
});

els.skip.addEventListener("click", () => resolveRound({ skipped: true }));
els.replay.addEventListener("click", startRaid);

setBusy(true);
loadModel()
  .then(startRaid)
  .catch((err) => {
    console.error(err);
    els.bootCopy.textContent =
      "Could not load the Hugging Face model. Check network access to huggingface.co and refresh.";
  });
