
const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");

let overlays = [];
let currentStep = 1;
let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let resizing = false;
let resizeCorner = null;



function showStep(stepNum) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    if (el) el.classList.add("hidden");
  }
  const next = document.getElementById(`step${stepNum}`);
  if (next) next.classList.remove("hidden");
  currentStep = stepNum;
}

function advanceStep(delta) {
  const newStep = currentStep + delta;
  if (newStep >= 1 && newStep <= 4) {
    showStep(newStep);
  }
}


function drawCanvas(showHandles = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = overlays.find(o => o.bg);
  if (bg) ctx.drawImage(bg.img, 0, 0, canvas.width, canvas.height);

  overlays.forEach(o => {
    if (!o.bg) {
      ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
      if (showHandles && o.selected) {
        ctx.strokeStyle = o.mobileSafe ? "lime" : "red";
        ctx.strokeRect(o.x, o.y, o.width, o.height);
        drawHandles(o);
      }
    }
  });
}

function drawHandles(o) {
  const size = 10;
  const points = [
    [o.x, o.y],
    [o.x + o.width / 2, o.y],
    [o.x + o.width, o.y],
    [o.x + o.width, o.y + o.height / 2],
    [o.x + o.width, o.y + o.height],
    [o.x + o.width / 2, o.y + o.height],
    [o.x, o.y + o.height],
    [o.x, o.y + o.height / 2],
  ];
  ctx.fillStyle = "white";
  points.forEach(([x, y]) => {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  });
}

function getHandleAt(x, y, o) {
  const size = 10;
  const points = [
    [o.x, o.y, "nw"],
    [o.x + o.width / 2, o.y, "n"],
    [o.x + o.width, o.y, "ne"],
    [o.x + o.width, o.y + o.height / 2, "e"],
    [o.x + o.width, o.y + o.height, "se"],
    [o.x + o.width / 2, o.y + o.height, "s"],
    [o.x, o.y + o.height, "sw"],
    [o.x, o.y + o.height / 2, "w"],
  ];
  return points.find(([hx, hy]) => {
    return Math.abs(hx - x) <= size && Math.abs(hy - y) <= size;
  });
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let i = overlays.length - 1; i >= 0; i--) {
    const o = overlays[i];
    if (o.bg) continue;

    const handle = getHandleAt(x, y, o);
    if (handle) {
      dragTarget = o;
      resizing = true;
      resizeCorner = handle[2];
      return;
    }

    if (x >= o.x && x <= o.x + o.width && y >= o.y && y <= o.y + o.height) {
      overlays.forEach(ov => (ov.selected = false));
      o.selected = true;
      dragTarget = o;
      dragOffsetX = x - o.x;
      dragOffsetY = y - o.y;
      drawCanvas();
      return;
    }
  }

  overlays.forEach(ov => (ov.selected = false));
  drawCanvas();
});

canvas.addEventListener("mousemove", e => {
  if (!dragTarget) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (resizing) {
    const o = dragTarget;
    const minSize = 30;
    switch (resizeCorner) {
      case "nw":
        o.width += o.x - x;
        o.height += o.y - y;
        o.x = x;
        o.y = y;
        break;
      case "n":
        o.height += o.y - y;
        o.y = y;
        break;
      case "ne":
        o.width = x - o.x;
        o.height += o.y - y;
        o.y = y;
        break;
      case "e":
        o.width = x - o.x;
        break;
      case "se":
        o.width = x - o.x;
        o.height = y - o.y;
        break;
      case "s":
        o.height = y - o.y;
        break;
      case "sw":
        o.width += o.x - x;
        o.height = y - o.y;
        o.x = x;
        break;
      case "w":
        o.width += o.x - x;
        o.x = x;
        break;
    }
    o.width = Math.max(minSize, o.width);
    o.height = Math.max(minSize, o.height);
  } else {
    dragTarget.x = x - dragOffsetX;
    dragTarget.y = y - dragOffsetY;
  }

  drawCanvas();
});

canvas.addEventListener("mouseup", () => {
  dragTarget = null;
  resizing = false;
  resizeCorner = null;
});

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
    const x = (canvas.width - 1546) / 2;
    const y = (canvas.height - 423) / 2;
    overlays.push({ img, x: x, y: y, width: 1546, height: 423, mobileSafe: true, selected: true });
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

document.addEventListener("click", (e) => {
  if (e.target.id === "nextBtn") {
    if (currentStep < 4) advanceStep(1);
  } else if (e.target.id === "prevBtn") {
    if (currentStep > 1) advanceStep(-1);
  }
});


showStep(1);
window.advanceStep = advanceStep;
