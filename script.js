const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");

let overlays = [];
let currentStep = 1;

let dragTarget = null;
let dragType = null;
let dragHandle = null;
let startX, startY;

// STEP SYSTEM
function showStep(stepNumber) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('hidden', i + 1 !== stepNumber);
  });
  currentStep = stepNumber;
}

function advanceStep(delta) {
  const newStep = currentStep + delta;
  if (newStep >= 1 && newStep <= 4) {
    showStep(newStep);
  }
}

document.addEventListener("click", (e) => {
  if (e.target.id === "nextBtn") advanceStep(1);
  else if (e.target.id === "prevBtn") advanceStep(-1);
  else if (e.target.id === "skipBg") advanceStep(1);
});

// DRAWING LOGIC
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
    overlays.forEach(o => o.selected = false);
    overlays.push(overlay);
    drawCanvas();
  };
  img.src = URL.createObjectURL(file);
}

// INPUT HOOKS
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

// MOUSE EVENTS FOR DRAGGING AND RESIZING
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let o of overlays.slice().reverse()) {
    if (!o.selected) continue;
    const handles = [
      [o.x, o.y], [o.x + o.width / 2, o.y], [o.x + o.width, o.y],
      [o.x + o.width, o.y + o.height / 2], [o.x + o.width, o.y + o.height],
      [o.x + o.width / 2, o.y + o.height], [o.x, o.y + o.height],
      [o.x, o.y + o.height / 2]
    ];

    for (let i = 0; i < handles.length; i++) {
      const [hx, hy] = handles[i];
      if (Math.abs(mouseX - hx) < 10 && Math.abs(mouseY - hy) < 10) {
        dragTarget = o;
        dragType = "resize";
        dragHandle = i;
        startX = mouseX;
        startY = mouseY;
        return;
      }
    }

    if (mouseX > o.x && mouseX < o.x + o.width && mouseY > o.y && mouseY < o.y + o.height) {
      dragTarget = o;
      dragType = "move";
      startX = mouseX;
      startY = mouseY;
      return;
    }
  }
});

canvas.addEventListener("mousemove", e => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const dx = mouseX - startX;
  const dy = mouseY - startY;

  if (dragType === "move") {
    dragTarget.x += dx;
    dragTarget.y += dy;
  } else if (dragType === "resize") {
    if (dragHandle === 0) {
      dragTarget.x += dx;
      dragTarget.y += dy;
      dragTarget.width -= dx;
      dragTarget.height -= dy;
    } else if (dragHandle === 2) {
      dragTarget.y += dy;
      dragTarget.width += dx;
      dragTarget.height -= dy;
    } else if (dragHandle === 4) {
      dragTarget.width += dx;
      dragTarget.height += dy;
    } else if (dragHandle === 6) {
      dragTarget.x += dx;
      dragTarget.width -= dx;
      dragTarget.height += dy;
    }
  }

  startX = mouseX;
  startY = mouseY;
  drawCanvas();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
  dragType = null;
  dragHandle = null;
});
// Start on Step 1
drawCanvas();
showStep(1);
window.advanceStep = advanceStep;
