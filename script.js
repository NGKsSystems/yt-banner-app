
// === Canvas Setup ===
const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");

// === State ===
let overlays = [];
let currentStep = 1;

let dragTarget = null;
let dragType = null;
let dragHandle = null;
let startX, startY;

// === Step Logic ===
function showStep(stepNumber) {
  document.querySelectorAll(".step").forEach((el, i) => {
    el.classList.toggle("hidden", i + 1 !== stepNumber);
  });
  currentStep = stepNumber;
}

function advanceStep(delta) {
  const newStep = currentStep + delta;
  if (newStep >= 1 && newStep <= 4) {
    showStep(newStep);
  }
}
window.advanceStep = advanceStep;

// === Image Upload & Drawing ===
function drawHandles(obj) {
  const x = obj.x, y = obj.y, w = obj.width, h = obj.height;
  const points = [
    [x, y], [x + w / 2, y], [x + w, y],
    [x + w, y + h / 2], [x + w, y + h],
    [x + w / 2, y + h], [x, y + h],
    [x, y + h / 2]
  ];
  ctx.fillStyle = "white";
  points.forEach(([px, py]) => {
    ctx.fillRect(px - 5, py - 5, 10, 10);
  });
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const overlay of overlays) {
    ctx.drawImage(overlay.img, overlay.x, overlay.y, overlay.width, overlay.height);
    if (overlay.selected) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(overlay.x, overlay.y, overlay.width, overlay.height);
      drawHandles(overlay);
    }
  }
}

function loadImageToCanvas(file) {
  const img = new Image();
  img.onload = () => {
    const overlay = {
      img,
      x: 100,
      y: 100,
      width: img.width / 2,
      height: img.height / 2,
      selected: true
    };
    overlays.push(overlay);
    drawCanvas();
  };
  img.src = URL.createObjectURL(file);
}

// === Input Hooks ===
document.getElementById("bgInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    loadImageToCanvas(file);
    advanceStep(1);
  }
});

document.getElementById("mobileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    loadImageToCanvas(file);
    advanceStep(1);
  }
});

document.getElementById("extraInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    loadImageToCanvas(file);
    advanceStep(1);
  }
});

// === Step Buttons ===
document.getElementById("nextBtn").addEventListener("click", () => {
  advanceStep(1);
});

document.getElementById("prevBtn")?.addEventListener("click", () => {
  advanceStep(-1);
});

document.getElementById("skipBg")?.addEventListener("click", () => {
  advanceStep(1);
});

// === Drag & Resize ===
canvas.addEventListener("mousedown", (e) => {
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  for (let i = overlays.length - 1; i >= 0; i--) {
    const obj = overlays[i];
    const x = obj.x, y = obj.y, w = obj.width, h = obj.height;
    const handles = [
      [x, y], [x + w / 2, y], [x + w, y],
      [x + w, y + h / 2], [x + w, y + h],
      [x + w / 2, y + h], [x, y + h],
      [x, y + h / 2]
    ];

    for (let j = 0; j < handles.length; j++) {
      const [hx, hy] = handles[j];
      if (mouseX >= hx - 5 && mouseX <= hx + 5 &&
          mouseY >= hy - 5 && mouseY <= hy + 5) {
        dragTarget = obj;
        dragType = "resize";
        dragHandle = j;
        startX = mouseX;
        startY = mouseY;
        return;
      }
    }

    if (mouseX >= x && mouseX <= x + w &&
        mouseY >= y && mouseY <= y + h) {
      dragTarget = obj;
      dragType = "move";
      startX = mouseX;
      startY = mouseY;
      return;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragTarget) return;

  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const dx = mouseX - startX;
  const dy = mouseY - startY;

  if (dragType === "move") {
    dragTarget.x += dx;
    dragTarget.y += dy;
  } else if (dragType === "resize") {
    const handle = dragHandle;
    switch (handle) {
      case 0: dragTarget.x += dx; dragTarget.y += dy; dragTarget.width -= dx; dragTarget.height -= dy; break;
      case 1: dragTarget.y += dy; dragTarget.height -= dy; break;
      case 2: dragTarget.y += dy; dragTarget.width += dx; dragTarget.height -= dy; break;
      case 3: dragTarget.width += dx; break;
      case 4: dragTarget.width += dx; dragTarget.height += dy; break;
      case 5: dragTarget.height += dy; break;
      case 6: dragTarget.x += dx; dragTarget.height += dy; dragTarget.width -= dx; break;
      case 7: dragTarget.x += dx; dragTarget.width -= dx; break;
    }
  }

  startX = mouseX;
  startY = mouseY;
  drawCanvas();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
});
