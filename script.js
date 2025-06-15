const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");
let overlays = [];
let currentStep = 1;
let dragTarget = null;
let offsetX = 0;
let offsetY = 0;

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
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(o.x, o.y, o.width, o.height);
  const size = 10;
  const handles = [
    [o.x, o.y], [o.x + o.width / 2, o.y], [o.x + o.width, o.y],
    [o.x, o.y + o.height / 2], [o.x + o.width, o.y + o.height / 2],
    [o.x, o.y + o.height], [o.x + o.width / 2, o.y + o.height], [o.x + o.width, o.y + o.height],
  ];
  handles.forEach(([x, y]) => {
    ctx.fillStyle = "white";
    ctx.fillRect(x - size/2, y - size/2, size, size);
  });
}

function showStep(stepNum) {
  const stepUI = document.getElementById("stepUI");
  if (!stepUI) return;
  currentStep = stepNum;

  if (stepNum === 1) {
    stepUI.innerHTML = `
  <p>Step 1: Choose your background</p>
  <input type="file" id="bgInput" accept="image/*" />
  <button id="skipBg">Skip</button>
`;

    document.getElementById("bgInput").addEventListener("change", handleBackgroundUpload);
    document.getElementById("skipBg").addEventListener("click", () => showStep(2));
  }
  else if (stepNum === 2) {
    stepUI.innerHTML = \`
      <p>Step 2: Choose your mobile-safe image</p>
      <input type="file" id="mobileInput" accept="image/*" />
    \`;
    document.getElementById("mobileInput").addEventListener("change", handleMobileSafeUpload);
  }
  else if (stepNum === 3) {
    stepUI.innerHTML = \`
      <p>Step 3: Add additional images</p>
      <input type="file" id="extraInput" accept="image/*" />
    \`;
    document.getElementById("extraInput").addEventListener("change", handleOverlayUpload);
  }
  else if (stepNum === 4) {
    stepUI.innerHTML = \`
      <p>Step 4: Export your banner</p>
      <button id="exportBtn">Export Banner</button>
    \`;
    document.getElementById("exportBtn").addEventListener("click", exportBanner);
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

function exportBanner() {
  drawCanvas(false);
  const link = document.createElement("a");
  link.download = "yt_banner_final.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  drawCanvas(true);
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  dragTarget = overlays.findLast(o =>
    !o.bg &&
    x >= o.x && x <= o.x + o.width &&
    y >= o.y && y <= o.y + o.height
  );
  if (dragTarget) {
    offsetX = x - dragTarget.x;
    offsetY = y - dragTarget.y;
    overlays.forEach(o => o.selected = false);
    dragTarget.selected = true;
    drawCanvas();
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  dragTarget.x = x - offsetX;
  dragTarget.y = y - offsetY;
  drawCanvas();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
});

window.addEventListener("DOMContentLoaded", () => {
  showStep(1);
});
