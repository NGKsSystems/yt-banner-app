// ==============================================
// Project: X Banner Editor (Full Logic + Toggle)
// ==============================================

// === Global Variables ===
let canvas, ctx;
let overlays = [];
let thumbnails = [];
let selectedObjectIndex = -1;
let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragHandleIndex = -1;
let isBannerMode = true;

// === DOM Ready: Initialize Canvas + Load Mode ===
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  if (!canvas) return console.error("Canvas not found.");
  ctx = canvas.getContext("2d");

  // Check ?mode=pfp for launch override
  const urlParams = new URLSearchParams(window.location.search);
  const startInpfpMode = urlParams.get("mode") === 'pfp';
  isBannerMode = !startInpfpMode;

  // Apply starting canvas size
  canvas.width = isBannerMode ? 1500 : 400;
  canvas.height = isBannerMode ? 500 : 400;

  // Init handlers
  setupCanvasToggle();
  setupUploadHandler();
  setupInteractionHandlers();
  setupToolbarButtons();

  // Enable drag-and-drop support
  canvas.addEventListener("dragover", (e) => e.preventDefault());

  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const img = new Image();
      img.onload = () => {
        overlays.push({
          img: img,
          x: mouseX - data.width / 2,
          y: mouseY - data.height / 2,
          width: data.width,
          height: data.height,
          rotation: 0
        });
        drawCanvas();
      };
      img.src = data.src;
    } catch (err) {
      console.error("Invalid drop:", err);
    }
  });

  drawCanvas();
});

// === Canvas Toggle Button Logic ===
function setupCanvasToggle() {
  const toggleBtn = document.getElementById('toggleCanvasBtn');
  if (!toggleBtn) return;

  toggleBtn.textContent = isBannerMode ? '👤 Switch to PFP Mode' : '📢 Switch to Banner Mode';

  toggleBtn.addEventListener('click', () => {
    isBannerMode = !isBannerMode;
    canvas.width = isBannerMode ? 1500 : 400;
    canvas.height = isBannerMode ? 500 : 400;
    toggleBtn.textContent = isBannerMode ? '👤 Switch to PFP Mode' : '📢 Switch to Banner Mode';

    overlays = [];
    thumbnails = [];
    selectedObjectIndex = -1;
    drawCanvas();
    updateThumbnailBar();
  });
}

// === Upload Image(s) from File Input ===
function setupUploadHandler() {
  const input = document.getElementById("imageLoader");
  if (!input) return;

  input.addEventListener("change", (e) => {
    const files = e.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
  const width = 200;
  const height = 150;
  const obj = {
    img,
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0
  };
  addThumbnail(obj); // Only add to thumbnail bar, not canvas
};

        img.src = event.target.result;
      };
      reader.readAsDataURL(files[i]);
    }
  });
}

// === Add Image to Thumbnail Tray ===
function addThumbnail(obj) {
  const bar = document.getElementById("thumbnail-bar");
  const thumb = document.createElement("img");
  thumb.src = obj.img.src;
  thumb.className = "thumbnail";

  thumb.onclick = () => {
    const centered = {
      ...obj,
      x: (canvas.width - obj.width) / 2,
      y: (canvas.height - obj.height) / 2
    };
    overlays.push(centered);
    selectedObjectIndex = overlays.length - 1;
    drawCanvas();
  };

  thumb.draggable = true;
  thumb.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({
      src: obj.img.src,
      width: obj.width,
      height: obj.height
    }));
  });

  bar.appendChild(thumb);
  thumbnails.push(thumb);
}

function updateThumbnailBar() {
  const bar = document.getElementById("thumbnail-bar");
  bar.innerHTML = "";
  thumbnails.forEach((thumb) => bar.appendChild(thumb));
}

// === Canvas Draw Loop ===
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  overlays.forEach((obj, i) => {
    ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
    if (i === selectedObjectIndex) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      drawResizeHandles(obj);
    }
  });
}

// === Draw 8 Resize Handles ===
function drawResizeHandles(obj) {
  const size = 6;
  const positions = [
    { x: obj.x, y: obj.y },
    { x: obj.x + obj.width / 2, y: obj.y },
    { x: obj.x + obj.width, y: obj.y },
    { x: obj.x, y: obj.y + obj.height / 2 },
    { x: obj.x + obj.width, y: obj.y + obj.height / 2 },
    { x: obj.x, y: obj.y + obj.height },
    { x: obj.x + obj.width / 2, y: obj.y + obj.height },
    { x: obj.x + obj.width, y: obj.y + obj.height }
  ];
  ctx.fillStyle = "white";
  positions.forEach(pos => {
    ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
  });
}

// === Mouse Interactions: Move + Resize ===
function setupInteractionHandlers() {
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedObjectIndex = -1;
    isDragging = false;
    isResizing = false;
    isRotating = false;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const obj = overlays[i];
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const cos = Math.cos(-obj.rotation);
      const sin = Math.sin(-obj.rotation);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      const halfW = obj.width / 2;
      const halfH = obj.height / 2;

      const rotHandleY = -halfH - 30;
      if (Math.abs(localX) < 10 && Math.abs(localY - rotHandleY) < 10) {
        selectedObjectIndex = i;
        isRotating = true;
        return;
      }

      if (
        localX >= -halfW && localX <= halfW &&
        localY >= -halfH && localY <= halfH
      ) {
        selectedObjectIndex = i;
        dragOffset = { x: localX, y: localY };

        const handles = [
          [-halfW, -halfH], [0, -halfH], [halfW, -halfH],
          [-halfW, 0], [halfW, 0],
          [-halfW, halfH], [0, halfH], [halfW, halfH]
        ];

        const size = 6;
        handles.forEach(([hx, hy], index) => {
          if (
            localX >= hx - size && localX <= hx + size &&
            localY >= hy - size && localY <= hy + size
          ) {
            isResizing = true;
            dragHandleIndex = index;
          }
        });

        if (!isResizing) isDragging = true;
        return;
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (selectedObjectIndex === -1) return;

    const obj = overlays[selectedObjectIndex];
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const cos = Math.cos(-obj.rotation);
    const sin = Math.sin(-obj.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    if (isRotating) {
      obj.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      drawCanvas();
      return;
    }

    if (isDragging) {
      obj.x = mouseX - dragOffset.x * Math.cos(obj.rotation) + dragOffset.y * Math.sin(obj.rotation);
      obj.y = mouseY - dragOffset.x * Math.sin(obj.rotation) - dragOffset.y * Math.cos(obj.rotation);
      drawCanvas();
      return;
    }

    if (isResizing) {
      const handleX = [-1, 0, 1, -1, 1, -1, 0, 1][dragHandleIndex];
      const handleY = [-1, -1, -1, 0, 0, 1, 1, 1][dragHandleIndex];

      if (handleX !== 0) {
        let newWidth = (localX * handleX) + (obj.width / 2);
        obj.width = Math.max(20, newWidth);
        obj.x = cx - obj.width / 2;
      }

      if (handleY !== 0) {
        let newHeight = (localY * handleY) + (obj.height / 2);
        obj.height = Math.max(20, newHeight);
        obj.y = cy - obj.height / 2;
      }
    }

    obj.width = Math.max(20, obj.width);
    obj.height = Math.max(20, obj.height);
    drawCanvas();
  });

  // canvas.addEventListener("mouseup", ...)
window.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
});


// === Toolbar Buttons: Export, Layering, Delete ===
function setupToolbarButtons() {
  const exportBtn = document.getElementById("exportBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const startoverBtn = document.getElementById("startoverBtn");
  const forwardBtn = document.getElementById("bringForwardBtn");
  const backBtn = document.getElementById("sendBackwardBtn");

  if (exportBtn) exportBtn.onclick = exportBanner;

  if (deleteBtn) deleteBtn.onclick = () => {
    if (selectedObjectIndex !== -1) {
      overlays.splice(selectedObjectIndex, 1);
      selectedObjectIndex = -1;
      drawCanvas();
    }
  };

  if (startoverBtn) startoverBtn.onclick = () => {
    overlays = [];
    thumbnails = [];
    selectedObjectIndex = -1;
    document.getElementById("thumbnail-bar").innerHTML = "";
    drawCanvas();
  };

  if (forwardBtn) forwardBtn.onclick = () => {
    if (selectedObjectIndex > -1 && selectedObjectIndex < overlays.length - 1) {
      const temp = overlays[selectedObjectIndex];
      overlays[selectedObjectIndex] = overlays[selectedObjectIndex + 1];
      overlays[selectedObjectIndex + 1] = temp;
      selectedObjectIndex++;
      drawCanvas();
    }
  };

  if (backBtn) backBtn.onclick = () => {
    if (selectedObjectIndex > 0) {
      const temp = overlays[selectedObjectIndex];
      overlays[selectedObjectIndex] = overlays[selectedObjectIndex - 1];
      overlays[selectedObjectIndex - 1] = temp;
      selectedObjectIndex--;
      drawCanvas();
    }
  };
}

// === Export Canvas as PNG (Hide Handles) ===
function exportBanner() {
  const wasSelected = selectedObjectIndex;
  selectedObjectIndex = -1;
  drawCanvas();

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = isBannerMode ? "x-banner.png" : "x-pfp.png";
  a.click();

  selectedObjectIndex = wasSelected;
  drawCanvas();
}
