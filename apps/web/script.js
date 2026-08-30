const figureField = document.getElementById("figureField");
const customFigure = document.getElementById("customFigure");
const enterButton = document.getElementById("enterButton");
const progressText = document.getElementById("progressText");
const unlockState = document.getElementById("unlockState");
const customizer = document.getElementById("customizer");
const poseSelect = document.getElementById("poseSelect");
const accentInput = document.getElementById("accentInput");
const continueButton = document.getElementById("continueButton");
const pageShell = document.querySelector(".page-shell");

const storageKey = "whole-donuts-landing-state";
const fieldFigures = [
  { x: 6, y: 50, scale: 1, tilt: "-4deg", pose: "open" },
  { x: 14, y: 26, scale: 0.88, tilt: "2deg", pose: "signal" },
  { x: 20, y: 58, scale: 1.06, tilt: "-1deg", pose: "stride" },
  { x: 29, y: 35, scale: 0.92, tilt: "5deg", pose: "open" },
  { x: 35, y: 61, scale: 1.12, tilt: "-5deg", pose: "signal" },
  { x: 44, y: 22, scale: 0.8, tilt: "3deg", pose: "stride" },
  { x: 50, y: 48, scale: 1, tilt: "-2deg", pose: "open" },
  { x: 57, y: 66, scale: 1.16, tilt: "4deg", pose: "stride" },
  { x: 64, y: 31, scale: 0.86, tilt: "-3deg", pose: "signal" },
  { x: 70, y: 53, scale: 1.02, tilt: "2deg", pose: "open" },
  { x: 77, y: 18, scale: 0.74, tilt: "-6deg", pose: "stride" },
  { x: 83, y: 58, scale: 1.08, tilt: "3deg", pose: "signal" },
  { x: 90, y: 39, scale: 0.94, tilt: "-4deg", pose: "open" }
];

const poseMap = {
  open: {
    leftArm: [27, 48, 13, 61],
    rightArm: [27, 48, 41, 61],
    leftLeg: [27, 74, 18, 98],
    rightLeg: [27, 74, 36, 98]
  },
  stride: {
    leftArm: [27, 48, 14, 53],
    rightArm: [27, 48, 39, 66],
    leftLeg: [27, 74, 14, 98],
    rightLeg: [27, 74, 38, 90]
  },
  signal: {
    leftArm: [27, 48, 17, 28],
    rightArm: [27, 48, 41, 61],
    leftLeg: [27, 74, 19, 99],
    rightLeg: [27, 74, 35, 97]
  }
};

function createStickFigure(pose, accent) {
  const shape = poseMap[pose] || poseMap.open;
  const wrapper = document.createElement("div");
  wrapper.className = accent ? "stick-figure special" : "stick-figure";
  if (accent) {
    wrapper.style.setProperty("--accent", accent);
  }

  wrapper.innerHTML = `
    <svg viewBox="0 0 54 110" role="presentation" focusable="false">
      <circle cx="27" cy="18" r="10"></circle>
      <line x1="27" y1="28" x2="27" y2="74"></line>
      <line x1="${shape.leftArm[0]}" y1="${shape.leftArm[1]}" x2="${shape.leftArm[2]}" y2="${shape.leftArm[3]}"></line>
      <line x1="${shape.rightArm[0]}" y1="${shape.rightArm[1]}" x2="${shape.rightArm[2]}" y2="${shape.rightArm[3]}"></line>
      <line x1="${shape.leftLeg[0]}" y1="${shape.leftLeg[1]}" x2="${shape.leftLeg[2]}" y2="${shape.leftLeg[3]}"></line>
      <line x1="${shape.rightLeg[0]}" y1="${shape.rightLeg[1]}" x2="${shape.rightLeg[2]}" y2="${shape.rightLeg[3]}"></line>
    </svg>
  `;

  return wrapper;
}

function renderField() {
  figureField.innerHTML = "";
  fieldFigures.forEach((figure, index) => {
    const element = createStickFigure(figure.pose);
    element.style.left = `${figure.x}%`;
    element.style.top = `${figure.y}%`;
    element.style.setProperty("--x", "-50%");
    element.style.setProperty("--y", "-50%");
    element.style.setProperty("--scale", figure.scale);
    element.style.setProperty("--tilt", figure.tilt);
    element.style.setProperty("--delay", `${index * 0.22}s`);
    figureField.appendChild(element);
  });
}

function renderCustomFigure(state) {
  customFigure.innerHTML = "";
  customFigure.style.setProperty("--accent", state.accent);
  const figure = createStickFigure(state.pose, state.accent);
  figure.style.position = "static";
  figure.style.width = "96px";
  figure.style.height = "136px";
  figure.style.transform = "scale(1.15)";
  customFigure.appendChild(figure.firstElementChild);
}

function saveState(state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function applyUrlState(state) {
  const params = new URLSearchParams(window.location.search);
  if (params.get("completed") === "1") {
    state.completed = true;
  }

  const pose = params.get("pose");
  if (pose && poseMap[pose]) {
    state.pose = pose;
  }

  const accent = params.get("accent");
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
    state.accent = accent;
  }

  return state;
}

function readState() {
  const fallback = { completed: false, pose: "open", accent: "#ffb95e" };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return applyUrlState({ ...fallback, ...saved });
  } catch {
    return applyUrlState(fallback);
  }
}

function applyState(state) {
  poseSelect.value = state.pose;
  accentInput.value = state.accent;
  progressText.textContent = state.completed
    ? "The tunnel remembers you. Your figure is now part of the field."
    : "The first figure is waiting for you.";
  unlockState.classList.toggle("locked", !state.completed);
  pageShell.classList.toggle("completed", state.completed);
  continueButton.hidden = !state.completed;
  renderCustomFigure(state);
}

function completeJourney() {
  const state = readState();
  state.completed = true;
  saveState(state);
  applyState(state);
}

enterButton.addEventListener("click", completeJourney);
customizer.addEventListener("input", () => {
  const state = readState();
  state.pose = poseSelect.value;
  state.accent = accentInput.value;
  saveState(state);
  applyState(state);
});

renderField();
applyState(readState());
