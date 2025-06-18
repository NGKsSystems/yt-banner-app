// === Canvas Setup ===
const canvas = document.getElementById("bannerCanvas");
canvas.classList.add('empty');
canvas.width = 2560;
canvas.height = 1440;
const ctx = canvas.getContext("2d");

// === State ===
let overlays = [];
let currentStep = 1;
let dragTarget = null;
let dragType = null;
let dragHandle = null;
let startX, startY;

// === Image Upload & Drawing ===
function drawHandles(obj) {
  const { x, y, width: w, height: h } = obj;
  const points = [
    [x, y], [x + w / 2, y], [x + w, y],
    [x + w, y + h / 2], [x + w, y + h],
    [x + w / 2, y + h], [x, y + h],
    [x, y + h / 2]
  ];
  ctx.fillStyle = "white";
  points.forEach(([px, py]) => ctx.fillRect(px - 5, py - 5, 10, 10));
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  overlays.forEach(overlay => {
    ctx.drawImage(overlay.img, overlay.x, overlay.y, overlay.width, overlay.height);
    if (overlay.selected) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(overlay.x, overlay.y, overlay.width, overlay.height);
      drawHandles(overlay);
    }
  });
}

function loadImageToCanvas(file, stepNum) {
  const img = new Image();
  overlays = overlays.filter(ov => ov.step !== stepNum);

  img.onload = () => {
    let overlay;
    if (stepNum === 1) {
      overlay = {
        img, x: 0, y: 0,
        width: canvas.width,
        height: canvas.height,
        selected: true, step: stepNum
      };
    } else if (stepNum === 2) {
      overlay = {
        img,
        width: 1546, height: 423,
        x: (canvas.width - 1546) / 2,
        y: (canvas.height - 423) / 2,
        selected: true, step: stepNum
      };
    } else {
      overlay = {
        img, x: 100, y: 100,
        width: img.width / 2,
        height: img.height / 2,
        selected: true, step: stepNum
      };
    }
    overlays.push(overlay);
    drawCanvas();
    if (stepNum === 1) advanceStep(1);
  };
  img.src = URL.createObjectURL(file);
}
canvas.classList.remove('empty');
}

// === Export Button ===
document.getElementById("exportBtn").addEventListener("click", () => {
  overlays.forEach(o => o.selected = false);
  drawCanvas();

  const link = document.createElement("a");
  link.download = "banner.png";
  link.href = canvas.toDataURL("image/png");
  link.click();

  overlays.forEach(o => o.selected = true);
  drawCanvas();
});

// === Delete Selected ===
document.getElementById("deleteBtn").addEventListener("click", () => {
  const index = overlays.findIndex(o => o.selected);
  if (index !== -1) {
    overlays.splice(index, 1);
    drawCanvas();
  } else {
    console.warn("No overlay selected.");
  }
if (objects.length === 0) {
  canvas.classList.add('empty');
}
});

// === Start Over ===
document.getElementById("startoverBtn").addEventListener("click", () => {
  overlays.length = 0;
  ['bgInput', 'mobileInput', 'extraInput'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = '';
  });
  currentStep = 1;
  drawCanvas();
});

function advanceStep(delta) {
  const newStep = currentStep + delta;
  if (newStep >= 1 && newStep <= 4) {
    currentStep = newStep;
    drawCanvas();
  }
}
window.advanceStep = advanceStep;

// === Upload Hooks ===
document.getElementById("bgInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) loadImageToCanvas(file, 1);
});

document.getElementById("mobileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) loadImageToCanvas(file, 2);
});

document.getElementById("extraInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) loadImageToCanvas(file, 3);
});

// === Canvas Drag/Resize ===
canvas.addEventListener("mousedown", e => {
  const { offsetX: mx, offsetY: my } = e;

  for (let i = overlays.length - 1; i >= 0; i--) {
    const o = overlays[i];
    const { x, y, width: w, height: h } = o;
    const handles = [
      [x, y], [x + w / 2, y], [x + w, y],
      [x + w, y + h / 2], [x + w, y + h],
      [x + w / 2, y + h], [x, y + h],
      [x, y + h / 2]
    ];
    for (let j = 0; j < handles.length; j++) {
      const [hx, hy] = handles[j];
      if (Math.abs(mx - hx) < 8 && Math.abs(my - hy) < 8) {
        dragTarget = o;
        dragType = "resize";
        dragHandle = j;
        startX = mx;
        startY = my;
        overlays.forEach(o => o.selected = false);
        dragTarget.selected = true;
        return;
      }
    }

    if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
      dragTarget = o;
      dragType = "move";
      startX = mx;
      startY = my;
      overlays.forEach(o => o.selected = false);
      dragTarget.selected = true;
      return;
    }
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragTarget) return;
  const { offsetX: mx, offsetY: my } = e;
  const dx = mx - startX;
  const dy = my - startY;

  if (dragType === "move") {
    dragTarget.x += dx;
    dragTarget.y += dy;
  } else if (dragType === "resize") {
    switch (dragHandle) {
      case 0: dragTarget.x += dx; dragTarget.y += dy; dragTarget.width -= dx; dragTarget.height -= dy; break;
      case 1: dragTarget.y += dy; dragTarget.height -= dy; break;
      case 2: dragTarget.width += dx; dragTarget.y += dy; dragTarget.height -= dy; break;
      case 3: dragTarget.width += dx; break;
      case 4: dragTarget.width += dx; dragTarget.height += dy; break;
      case 5: dragTarget.height += dy; break;
      case 6: dragTarget.x += dx; dragTarget.width -= dx; dragTarget.height += dy; break;
      case 7: dragTarget.x += dx; dragTarget.width -= dx; break;
    }
  }

  startX = mx;
  startY = my;
  drawCanvas();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
});

// === Keyboard Arrow Movement ===
document.addEventListener("keydown", e => {
  const selected = overlays.find(o => o.selected);
  if (!selected) return;

  switch (e.key) {
    case "ArrowUp": selected.y -= 1; break;
    case "ArrowDown": selected.y += 1; break;
    case "ArrowLeft": selected.x -= 1; break;
    case "ArrowRight": selected.x += 1; break;
    default: return;
  }
  drawCanvas();
});



showStep(1);
window.exportBanner = exportBanner;
window.advanceStep = advanceStep;
