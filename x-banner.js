// Project: X Banner Editor (Full Feature Port)
// Based on YT full logic — adapted for single input, multi-load, and thumbnail tray
document.addEventListener("DOMContentLoaded", () => {
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let overlays = [];
let selectedObjectIndex = -1;
let currentImage = null;
let objects = [];
let selectedObjectIndex = -1;
let thumbnails = [];

function initCanvas() {
  canvas.width = 1600;
  canvas.height = 900;
  drawCanvas();
}

Function handleFileUpload(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (e) {
      let img = new Image();
      img.onload = function () {
        let obj = {
          img: img,
          x: 100 + i * 10,
          y: 100 + i * 10,
          width: 200,
          height: 150,
        };
        objects.push(obj);
        thumbnails.push(e.target.result);
        updateThumbnailTray();
        drawCanvas();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(files[i]);
  }
}

function updateThumbnailTray() {
  const tray = document.getElementById("thumbnail-tray");
  tray.innerHTML = "";
  thumbnails.forEach((src, index) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.className = "thumbnail";
    thumb.onclick = () => {
      selectedObjectIndex = index;
      drawCanvas();
    };
    tray.appendChild(thumb);
  });
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  objects.forEach((obj, index) => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
  if (index === selectedObjectIndex) {
  drawResizeHandles(obj);
}

  });
}

function drawHandles(obj) {
  const size = 10;
  const handles = getHandlePositions(obj);
  ctx.fillStyle = 'cyan';
  for (let h of handles) {
    ctx.fillRect(h.x - size / 2, h.y - size / 2, size, size);
  }
}

function getHandlePositions(obj) {
  const { x, y, width: w, height: h } = obj;
  return [
    { x: x, y: y },
    { x: x + w / 2, y: y },
    { x: x + w, y: y },
    { x: x, y: y + h / 2 },
    { x: x + w, y: y + h / 2 },
    { x: x, y: y + h },
    { x: x + w / 2, y: y + h },
    { x: x + w, y: y + h },
  ];
}

function exportBanner() {
  let link = document.createElement("a");
  link.download = "X-banner.png";
  link.href = canvas.toDataURL();
  link.click();
}

function deleteSelectedImage() {
  if (selectedObjectIndex > -1) {
    objects.splice(selectedObjectIndex, 1);
    thumbnails.splice(selectedObjectIndex, 1);
    selectedObjectIndex = -1;
    updateThumbnailTray();
    drawCanvas();
  }
}

// === Globals for Drag & Resize Support ===
let dragStart = null;
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let isResizing = false;
let dragHandleIndex = -1;
let startX = 0;
let startY = 0;

// === Utility: Get Resize Handle Positions ===
function getHandlePositions(obj) {
  const { x, y, width: w, height: h } = obj;
  return [
    { x: x, y: y },                     // Top-left
    { x: x + w / 2, y: y },             // Top-center
    { x: x + w, y: y },                 // Top-right
    { x: x, y: y + h / 2 },             // Middle-left
    { x: x + w, y: y + h / 2 },         // Middle-right
    { x: x, y: y + h },                 // Bottom-left
    { x: x + w / 2, y: y + h },         // Bottom-center
    { x: x + w, y: y + h }              // Bottom-right
  ];
}

function drawResizeHandles(obj) {
  const handles = getHandlePositions(obj);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  handles.forEach(h => {
    ctx.fillRect(h.x - 4, h.y - 4, 8, 8);     // White square
    ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);   // Black border
  });
}

// === Mousedown ===
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  dragHandleIndex = -1;
  isResizing = false;
  isDragging = false;
  selectedObjectIndex = -1;

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    const handles = getHandlePositions(obj);
    for (let j = 0; j < handles.length; j++) {
      const h = handles[j];
      if (Math.abs(mouseX - h.x) < 8 && Math.abs(mouseY - h.y) < 8) {
        dragHandleIndex = j;
        selectedObjectIndex = i;
        isResizing = true;
        startX = mouseX;
        startY = mouseY;
        return;
      }
    }
    if (
      mouseX >= obj.x && mouseX <= obj.x + obj.width &&
      mouseY >= obj.y && mouseY <= obj.y + obj.height
    ) {
      selectedObjectIndex = i;
      dragOffset = {
        x: mouseX - obj.x,
        y: mouseY - obj.y
      };
      isDragging = true;
      return;
    }
  }
});

// === Mousemove ===
canvas.addEventListener("mousemove", (e) => {
  if (selectedObjectIndex === -1) return;
  const obj = objects[selectedObjectIndex];
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isResizing) {
    const dx = mouseX - startX;
    const dy = mouseY - startY;
    switch (dragHandleIndex) {
      case 0: obj.x += dx; obj.y += dy; obj.width -= dx; obj.height -= dy; break;
      case 1: obj.y += dy; obj.height -= dy; break;
      case 2: obj.y += dy; obj.width += dx; obj.height -= dy; break;
      case 3: obj.x += dx; obj.width -= dx; break;
      case 4: obj.width += dx; break;
      case 5: obj.x += dx; obj.width -= dx; obj.height += dy; break;
      case 6: obj.height += dy; break;
      case 7: obj.width += dx; obj.height += dy; break;
    }
    startX = mouseX;
    startY = mouseY;
  } else if (isDragging) {
    obj.x = mouseX - dragOffset.x;
    obj.y = mouseY - dragOffset.y;
  }

  drawCanvas();
});

// === Mouseup ===
canvas.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  dragHandleIndex = -1;
});

// === Keyboard Arrow Key Movement ===
document.addEventListener("keydown", function (e) {
  if (selectedObjectIndex === -1) return;
  let obj = objects[selectedObjectIndex];
  const step = 5;

  switch (e.key) {
    case "ArrowUp":    obj.y -= step; break;
    case "ArrowDown":  obj.y += step; break;
    case "ArrowLeft":  obj.x -= step; break;
    case "ArrowRight": obj.x += step; break;
    default: return;
  }

  drawCanvas();
});
