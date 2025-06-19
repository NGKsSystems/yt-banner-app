// ==============================================
// Project: X Banner Editor (Full Logic + Toggle)
// ==============================================

// === Global Variables ===
let canvas, ctx;                         // Canvas & drawing context
let overlays = [];                      // Loaded image overlays
let thumbnails = [];                    // Thumbnail image references
let selectedObjectIndex = -1;           // Currently selected overlay
let dragOffset = { x: 0, y: 0 };        // Drag position offset
let isDragging = false;                 // Dragging state
let isResizing = false;                 // Resizing state
let dragHandleIndex = -1;               // Which handle is being used
let isBannerMode = true;                // Current canvas mode (true = Banner, false = PFP)


// === DOM Ready: Initialize Canvas + Load Mode ===
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("canvas");
  if (!canvas) return console.error("Canvas not found.");
  ctx = canvas.getContext("2d");

  // Check ?mode=pfp for launch override
  const urlParams = new URLSearchParams(window.location.search);
  const startInPFPMode = urlParams.get("mode") === 'pfp';
  isBannerMode = !startInPFPMode;

  // Apply starting canvas size
  canvas.width = isBannerMode ? 1500 : 400;
  canvas.height = isBannerMode ? 500 : 400;

  // Init button labels + handlers
  setupCanvasToggle();
  setupUploadHandler();
  setupInteractionHandlers();
  setupToolbarButtons();

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

    // Clear overlays on mode switch
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
          const obj = {
            img,
            x: 100 + i * 10,
            y: 100 + i * 10,
            width: 200,
            height: 150
          };
          overlays.push(obj);
          addThumbnail(obj);
          drawCanvas();
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
    selectedObjectIndex = overlays.indexOf(obj);
    drawCanvas();
  };
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
      ctx.strokeStyle = "white";                 // Draw guide border
      ctx.lineWidth = 1;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      drawResizeHandles(obj);                    // Show resize handles
    }
  });
}


// === Draw 8 Resize Handles ===
function drawResizeHandles(obj) {
  const size = 6;
  const positions = [
    { x: obj.x, y: obj.y },                                               // Top-left
    { x: obj.x + obj.width / 2, y: obj.y },                               // Top-center
    { x: obj.x + obj.width, y: obj.y },                                   // Top-right
    { x: obj.x, y: obj.y + obj.height / 2 },                              // Middle-left
    { x: obj.x + obj.width, y: obj.y + obj.height / 2 },                  // Middle-right
    { x: obj.x, y: obj.y + obj.height },                                  // Bottom-left
    { x: obj.x + obj.width / 2, y: obj.y + obj.height },                  // Bottom-center
    { x: obj.x + obj.width, y: obj.y + obj.height }                       // Bottom-right
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

    // Transform mouse to local coordinates
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const cos = Math.cos(-obj.rotation);
    const sin = Math.sin(-obj.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const halfW = obj.width / 2;
    const halfH = obj.height / 2;

    // Check for rotation handle
    const rotHandleY = -halfH - 30;
    if (Math.abs(localX) < 10 && Math.abs(localY - rotHandleY) < 10) {
      selectedObjectIndex = i;
      isRotating = true;
      return;
    }

    // Check bounding box hit
    if (
      localX >= -halfW && localX <= halfW &&
      localY >= -halfH && localY <= halfH
    ) {
      selectedObjectIndex = i;
      dragOffset = { x: localX, y: localY };

      // Check if near corner for resize
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
      obj.width = Math.max(20, newWidth * 2);
      obj.x = cx - obj.width / 2;
    }

    if (handleY !== 0) {
      let newHeight = (localY * handleY) + (obj.height / 2);
      obj.height = Math.max(20, newHeight * 2);
      obj.y = cy - obj.height / 2;
    }

    drawCanvas();
  }
});


      // === Enforce Minimum Size ===
      obj.width = Math.max(20, obj.width);
      obj.height = Math.max(20, obj.height);
    } else if (isDragging) {
      obj.x = mouseX - dragOffset.x;
      obj.y = mouseY - dragOffset.y;
    }

    drawCanvas();
  });

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
});
}


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
      overlays.splice(selectedObjectIndex, 1);  // Remove image from canvas
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
  drawCanvas(); // Draw without handles

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = isBannerMode ? "x-banner.png" : "x-pfp.png";
  a.click();

  selectedObjectIndex = wasSelected;
  drawCanvas(); // Restore handles
}
