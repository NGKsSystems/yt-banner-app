const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");

let overlays = [];
let currentStep = 1;

function showStep(stepNum) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (el) el.classList.add("hidden");
  }
  const next = document.getElementById(`step${stepNum}`);
  if (next) next.classList.remove("hidden");
  currentStep = stepNum;
}

function advanceStep() {
  showStep(currentStep + 1);
}

function drawHandles(obj) {
  const x = obj.x, y = obj.y, w = obj.width, h = obj.height;
  const points = [
    [x, y], [x + w/2, y], [x + w, y],
    [x + w, y + h/2], [x + w, y + h],
    [x + w/2, y + h], [x, y + h],
    [x, y + h/2]
  ];
  ctx.fillStyle = "white";
  points.forEach(([px, py]) => {
    ctx.fillRect(px - 5, py - 5, 10, 10);
  });
}

function drawCanvas(showHandles = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = overlays.find(o => o.bg);
  if (bg) ctx.drawImage(bg.img, 0, 0, canvas.width, canvas.height);

  overlays.forEach(o => {
    if (!o.bg) ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    ctx.strokeStyle = o.mobileSafe ? "lime" : "red";
    ctx.strokeRect(o.x, o.y, o.width, o.height);
    if (showHandles && o.selected) drawHandles(o);
  });
}

document.getElementById("bgInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    overlays.push({ img, x: 0, y: 0, width: canvas.width, height: canvas.height, bg: true });
    drawCanvas();
    advanceStep();
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById("skipBg").addEventListener("click", () => {
  advanceStep();
});

document.getElementById("mobileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const width = 1546, height = 423;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    overlays.push({ img, x, y, width, height, mobileSafe: true, selected: true });
    drawCanvas();
    advanceStep();
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById("extraInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    overlays.push({ img, x: 100, y: 100, width: 300, height: 100, selected: true });
    drawCanvas();
    advanceStep();
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById("exportBtn").addEventListener("click", () => {
  overlays.forEach(o => o.selected = false);
  drawCanvas(false);
  const link = document.createElement("a");
  link.download = "yt_banner_final.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  drawCanvas(true);
});

showStep(1);
