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

function drawCanvas(showHandles = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = overlays.find(o => o.bg);
  if (bg) ctx.drawImage(bg.img, 0, 0, canvas.width, canvas.height);

  overlays.forEach(o => {
    if (!o.bg) ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    if (showHandles && o.selected) {
      ctx.strokeStyle = o.mobileSafe ? "lime" : "red";
      ctx.strokeRect(o.x, o.y, o.width, o.height);
    }
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
    overlays.push({ img, x: 100, y: 100, width: 1546, height: 423, mobileSafe: true, selected: true });
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
  drawCanvas(false);
  const link = document.createElement("a");
  link.download = "yt_banner_final.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  drawCanvas(true);
});

showStep(1);
