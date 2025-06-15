const canvas = document.getElementById("bannerCanvas");
const ctx = canvas.getContext("2d");

let overlays = [];
let currentStep = 1;

// Mouse Down
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = overlays.length - 1; i >= 0; i--) {
    const img = overlays[i];
    const x = img.x;
    const y = img.y;
    const w = img.width * img.scale;
    const h = img.height * img.scale;

    const handles = [
      { x: x, y: y, type: "nw" },
      { x: x + w / 2, y: y, type: "n" },
      { x: x + w, y: y, type: "ne" },
      { x: x, y: y + h / 2, type: "w" },
      { x: x + w, y: y + h / 2, type: "e" },
      { x: x, y: y + h, type: "sw" },
      { x: x + w / 2, y: y + h, type: "s" },
      { x: x + w, y: y + h, type: "se" }
    ];

    for (const handle of handles) {
      if (Math.abs(mouseX - handle.x) < 10 && Math.abs(mouseY - handle.y) < 10) {
        dragTarget = img;
        dragType = handle.type;
        startX = mouseX;
        startY = mouseY;
        return;
      }
    }

    if (
      mouseX >= x && mouseX <= x + w &&
      mouseY >= y && mouseY <= y + h
    ) {
      dragTarget = img;
      dragType = "move";
      startX = mouseX;
      startY = mouseY;
      return;
    }
  }
});

// Mouse Move
canvas.addEventListener("mousemove", (e) => {
  if (!dragTarget) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const dx = mouseX - startX;
  const dy = mouseY - startY;

  if (dragType === "move") {
    dragTarget.x += dx;
    dragTarget.y += dy;
  } else {
    const scaleAmount = 1 + dx / dragTarget.width;
    dragTarget.scale *= scaleAmount;
    if (dragTarget.scale < 0.1) dragTarget.scale = 0.1;
  }

  startX = mouseX;
  startY = mouseY;
  drawCanvas();
});

// Mouse Up
canvas.addEventListener("mouseup", () => {
  dragTarget = null;
  dragType = null;
});



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

function drawCanvas(showHandles = true) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = overlays.find(o => o.bg);
  if (bg) ctx.drawImage(bg.img, 0, 0, canvas.width, canvas.height);

  overlays.forEach(o => {
    if (!o.bg) ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    ctx.strokeStyle = o.strokeStyle || (o.mobileSafe ? "lime" : "red");
    ctx.strokeRect(o.x, o.y, o.width, o.height);
    if (showHandles && o.selected) drawHandles(o);
  });
}

document.getElementById("bgInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    overlays.push({
      img,
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      bg: true,
      strokeStyle: "transparent"
    });
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
    overlays.push({
      img,
      x,
      y,
      width,
      height,
      mobileSafe: true,
      selected: true,
      strokeStyle: "lime"
    });
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
    overlays.push({
      img,
      x: 100,
      y: 100,
      width: 300,
      height: 100,
      selected: true,
      strokeStyle: "red"
    });
    drawCanvas();
    advanceStep();
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById("exportBtn").addEventListener("click", () => {
  overlays.forEach(o => o.selected = false);

  const previousStrokeStyles = overlays.map(o => o.strokeStyle);
  overlays.forEach(o => o.strokeStyle = "transparent");

  drawCanvas(false);

  const link = document.createElement("a");
  link.download = "yt_banner_final.png";
  link.href = canvas.toDataURL("image/png");
  link.click();

  overlays.forEach((o, i) => o.strokeStyle = previousStrokeStyles[i]);
  overlays.forEach(o => o.selected = true);
  drawCanvas(true);
});


canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let o of overlays) {
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
        dragType = i;
        startX = mouseX;
        startY = mouseY;
        dragType = "resize";
        return;
      }
    }

    if (mouseX >= o.x && mouseX <= o.x + o.width &&
        mouseY >= o.y && mouseY <= o.y + o.height) {
      dragTarget = o;
      dragType = "move";
      startX = mouseX - o.x;
      startY = mouseY - o.y;
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

  switch (dragType) {
    case "move":
      dragTarget.x = mouseX - startX;
      dragTarget.y = mouseY - startY;
      break;
    case 0:
      dragTarget.width += dragTarget.x - mouseX;
      dragTarget.height += dragTarget.y - mouseY;
      dragTarget.x = mouseX;
      dragTarget.y = mouseY;
      break;
    case 1:
      dragTarget.height += dragTarget.y - mouseY;
      dragTarget.y = mouseY;
      break;
    case 2:
      dragTarget.width = mouseX - dragTarget.x;
      dragTarget.height += dragTarget.y - mouseY;
      dragTarget.y = mouseY;
      break;
    case 3:
      dragTarget.width = mouseX - dragTarget.x;
      break;
    case 4:
      dragTarget.width = mouseX - dragTarget.x;
      dragTarget.height = mouseY - dragTarget.y;
      break;
    case 5:
      dragTarget.height = mouseY - dragTarget.y;
      break;
    case 6:
      dragTarget.width += dragTarget.x - mouseX;
      dragTarget.height = mouseY - dragTarget.y;
      dragTarget.x = mouseX;
      break;
    case 7:
      dragTarget.width += dragTarget.x - mouseX;
      dragTarget.x = mouseX;
      break;
  }

  dragTarget.width = Math.max(20, dragTarget.width);
  dragTarget.height = Math.max(20, dragTarget.height);
  drawCanvas();
});

canvas.addEventListener("mouseup", () => {

});

showStep(1);
window.advanceStep = advanceStep;
