function showStep(stepNum) {
  const stepUI = document.getElementById("stepUI");
  if (!stepUI) return;

  if (stepNum === 1) {
    stepUI.innerHTML = `
      <p>Step 1: Choose your background</p>
      <input type="file" id="bgInput" accept="image/*" />
      <button id="skipBg">Skip</button>
    `;
    document.getElementById("bgInput").addEventListener("change", handleBackgroundUpload);
    document.getElementById("skipBg").addEventListener("click", () => showStep(2));
  } else if (stepNum === 2) {
    stepUI.innerHTML = `
      <p>Step 2: Choose your mobile-safe image</p>
      <input type="file" id="mobileInput" accept="image/*" />
    `;
    document.getElementById("mobileInput").addEventListener("change", handleMobileSafeUpload);
  } else if (stepNum === 3) {
    stepUI.innerHTML = `
      <p>Step 3: Add additional images</p>
      <input type="file" id="extraInput" accept="image/*" />
    `;
    document.getElementById("extraInput").addEventListener("change", handleOverlayUpload);
  } else if (stepNum === 4) {
    stepUI.innerHTML = `
      <p>Step 4: Export your banner</p>
      <button id="exportBtn">Export Banner</button>
    `;
    document.getElementById("exportBtn").addEventListener("click", () => {
      drawCanvas(false);
      const link = document.createElement("a");
      link.download = "yt_banner_final.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      drawCanvas(true);
    });
  }
}

function handleBackgroundUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    overlays.push({ img, x: 0, y: 0, width: canvas.width, height: canvas.height, bg: true });
    drawCanvas();
    showStep(2);
  };
  img.src = URL.createObjectURL(file);
}

function handleMobileSafeUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const x = (canvas.width - 1546) / 2;
    overlays.push({ img, x, y: 100, width: 1546, height: 423, mobileSafe: true, selected: true });
    drawCanvas();
    showStep(3);
  };
  img.src = URL.createObjectURL(file);
}

function handleOverlayUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    overlays.push({ img, x: 100, y: 100, width: 300, height: 100, selected: true });
    drawCanvas();
    showStep(4);
  };
  img.src = URL.createObjectURL(file);
}

const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");
const overlays = [];
let dragTarget = null;
let currentStep = 1;

function drawCanvas(showHandles = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = overlays.find(o => o.bg);
  if (bg) ctx.drawImage(bg.img, 0, 0, canvas.width, canvas.height);

  overlays.forEach(o => {
    if (!o.bg) ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    if (showHandles && o.selected) drawHandles(o);
  });
}

function drawHandles(o) {
  ctx.strokeStyle = o.mobileSafe ? "lime" : "red";
  ctx.strokeRect(o.x, o.y, o.width, o.height);
}

window.addEventListener("DOMContentLoaded", () => showStep(1));
